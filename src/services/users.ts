import bcrypt from "bcryptjs";
import { db } from "@/database/client";
import { ConflictError, ForbiddenError, NotFoundError, RateLimitError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rate-limit";
import type { SessionUser } from "@/lib/guards";
import type { MedicalProfile, PatientSummary, Role } from "@/types";
import { audit } from "@/services/audit";

const BCRYPT_COST = 12;

// A real hash to compare against when the email is unknown, so response time
// does not reveal which emails have accounts.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", BCRYPT_COST);

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  doctorId?: string;
  patientId?: string;
}

/** Verifies credentials. Returns null on any failure (never says which part was wrong). */
export async function authenticate(email: string, password: string, ip = "unknown"): Promise<AuthenticatedUser | null> {
  // Throttle guessing per account and per IP.
  const byEmail = checkRateLimit({ scope: "login-email", key: email, limit: 8, windowMs: 15 * 60_000 });
  const byIp = checkRateLimit({ scope: "login-ip", key: ip, limit: 30, windowMs: 15 * 60_000 });
  if (!byEmail.ok || !byIp.ok) {
    await audit({ action: "LOGIN_RATE_LIMITED", entityType: "User", metadata: { email }, ipAddress: ip });
    return null;
  }

  const user = await db.user.findUnique({
    where: { email },
    include: { patient: { select: { id: true } }, doctor: { select: { id: true } } },
  });

  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid || !user.isActive) {
    await audit({ userId: user?.id, action: "LOGIN_FAILED", entityType: "User", entityId: user?.id, ipAddress: ip });
    return null;
  }

  await audit({ userId: user.id, action: "LOGIN_SUCCEEDED", entityType: "User", entityId: user.id, ipAddress: ip });
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    doctorId: user.doctor?.id,
    patientId: user.patient?.id,
  };
}

export async function registerPatient(
  input: { name: string; email: string; password: string; phone?: string },
  ip = "unknown"
): Promise<{ id: string; email: string }> {
  const limit = checkRateLimit({ scope: "register-ip", key: ip, limit: 10, windowMs: 60 * 60_000 });
  if (!limit.ok) throw new RateLimitError(limit.retryAfterSeconds, "Too many sign-up attempts. Please try again later.");

  const existing = await db.user.findUnique({ where: { email: input.email } });
  if (existing) throw new ConflictError("An account with this email already exists.", "EMAIL_TAKEN");

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
  const user = await db.user.create({
    data: {
      email: input.email,
      passwordHash,
      name: input.name,
      phone: input.phone,
      role: "PATIENT",
      patient: { create: { medicalProfile: { create: {} } } },
    },
  });
  await audit({ userId: user.id, action: "PATIENT_REGISTERED", entityType: "User", entityId: user.id, ipAddress: ip });
  return { id: user.id, email: user.email };
}

// ---------------------------------------------------------------- patients

export async function getPatientName(patientId: string): Promise<string | null> {
  const p = await db.patient.findUnique({ where: { id: patientId }, include: { user: { select: { name: true } } } });
  return p?.user.name ?? null;
}

export async function listPatients(): Promise<PatientSummary[]> {
  const rows = await db.patient.findMany({
    include: {
      user: { select: { name: true, email: true, phone: true, createdAt: true } },
      appointments: { select: { date: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((p) => {
    const visits = p.appointments.filter((a) => a.status === "COMPLETED").map((a) => a.date).sort();
    return {
      id: p.id,
      name: p.user.name,
      email: p.user.email,
      phone: p.user.phone ?? undefined,
      appointmentCount: p.appointments.length,
      lastVisit: visits.at(-1),
      createdAt: p.user.createdAt.toISOString(),
    };
  });
}

/**
 * Patient record for a treating doctor. A doctor may only open patients they
 * have (or had) an appointment with; admins may open any record. Every view is
 * audit-logged because it exposes protected health information.
 */
export async function getPatientRecordForDoctor(user: SessionUser, patientId: string, ip?: string) {
  if (user.role === "DOCTOR") {
    if (!user.doctorId) throw new ForbiddenError();
    const relationship = await db.appointment.findFirst({ where: { doctorId: user.doctorId, patientId }, select: { id: true } });
    if (!relationship) throw new ForbiddenError("You can only view patients you have appointments with.");
  } else if (user.role !== "ADMIN") {
    throw new ForbiddenError();
  }

  const patient = await db.patient.findUnique({
    where: { id: patientId },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      medicalProfile: true,
      documents: { orderBy: { uploadedAt: "desc" } },
    },
  });
  if (!patient) throw new NotFoundError("Patient not found.");

  await audit({ userId: user.id, action: "PATIENT_RECORD_VIEWED", entityType: "Patient", entityId: patientId, ipAddress: ip });
  return patient;
}

// ---------------------------------------------------------------- medical profile

const EMPTY_PROFILE: MedicalProfile = {
  allergies: [],
  currentMedications: [],
  medicalHistory: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
};

export async function getMedicalProfile(patientId: string): Promise<MedicalProfile> {
  const row = await db.medicalProfile.findUnique({ where: { patientId } });
  if (!row) return EMPTY_PROFILE;
  return {
    allergies: row.allergies,
    currentMedications: row.currentMedications,
    medicalHistory: row.medicalHistory ?? "",
    emergencyContactName: row.emergencyContactName ?? "",
    emergencyContactPhone: row.emergencyContactPhone ?? "",
  };
}

export async function saveMedicalProfile(user: SessionUser, patientId: string, profile: MedicalProfile, ip?: string) {
  const data = {
    allergies: profile.allergies,
    currentMedications: profile.currentMedications,
    medicalHistory: profile.medicalHistory,
    emergencyContactName: profile.emergencyContactName,
    emergencyContactPhone: profile.emergencyContactPhone,
  };
  await db.medicalProfile.upsert({ where: { patientId }, create: { patientId, ...data }, update: data });
  await audit({ userId: user.id, action: "MEDICAL_PROFILE_UPDATED", entityType: "Patient", entityId: patientId, ipAddress: ip });
  return profile;
}
