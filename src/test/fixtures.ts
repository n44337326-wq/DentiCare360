import bcrypt from "bcryptjs";
import type { PrismaClient } from "@/generated/prisma/client";
import { addDays, clinicToday, dayOfWeek } from "@/lib/time";
import type { SessionUser } from "@/lib/guards";

/** Test data builders. Everything is created through the real Prisma client. */

let counter = 0;
const uid = () => `${Date.now().toString(36)}${(counter++).toString(36)}`;

export const PASSWORD = "Passw0rd!test";
const HASH = bcrypt.hashSync(PASSWORD, 4); // low cost: tests only

export interface World {
  specialtyId: string;
  otherSpecialtyId: string;
  serviceId: string;
  otherServiceId: string;
  doctor: { id: string; userId: string; user: SessionUser };
  otherDoctor: { id: string; userId: string; user: SessionUser };
  patientA: { id: string; userId: string; user: SessionUser; email: string };
  patientB: { id: string; userId: string; user: SessionUser; email: string };
  admin: SessionUser;
}

/** Every weekday open 09:00–17:00 with a 12:00–13:00 break, so any future date is bookable. */
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
  dayOfWeek,
  startTime: "09:00",
  endTime: "17:00",
  breakStart: "12:00",
  breakEnd: "13:00",
  isActive: true,
}));

export async function createDoctor(db: PrismaClient, specialtyId: string, over: { name?: string; autoConfirm?: boolean; supportsOnline?: boolean } = {}) {
  const user = await db.user.create({
    data: { email: `doc-${uid()}@test.example`, name: over.name ?? "Dr. Test", role: "DOCTOR", passwordHash: HASH },
  });
  const doctor = await db.doctor.create({
    data: {
      userId: user.id,
      specialtyId,
      title: "General Dentistry",
      bio: "Test doctor",
      qualifications: ["DDS"],
      areasOfExpertise: ["Checkups"],
      languages: ["English"],
      experienceYears: 5,
      consultationFee: 60,
      rating: 4.8,
      reviewCount: 10,
      location: "Test Clinic",
      supportsOnline: over.supportsOnline ?? true,
      supportsInPerson: true,
      autoConfirm: over.autoConfirm ?? true,
      availability: { create: ALL_DAYS },
    },
  });
  return {
    id: doctor.id,
    userId: user.id,
    user: { id: user.id, role: "DOCTOR", name: user.name, email: user.email, doctorId: doctor.id } as SessionUser,
  };
}

export async function createPatient(db: PrismaClient, name = "Pat Ient") {
  const email = `pat-${uid()}@test.example`;
  const user = await db.user.create({ data: { email, name, role: "PATIENT", passwordHash: HASH } });
  const patient = await db.patient.create({ data: { userId: user.id } });
  return {
    id: patient.id,
    userId: user.id,
    email,
    user: { id: user.id, role: "PATIENT", name, email, patientId: patient.id } as SessionUser,
  };
}

export async function createWorld(db: PrismaClient): Promise<World> {
  const specialty = await db.specialty.create({ data: { name: `Dental ${uid()}`, slug: "dental" } });
  const other = await db.specialty.create({ data: { name: `Derm ${uid()}`, slug: "dermatology" } });
  const service = await db.service.create({
    data: { name: "Checkup", slug: `checkup-${uid()}`, category: "Dental", description: "Routine", durationMinutes: 30, startingPrice: 45, specialistLabel: "Dentist", specialtyId: specialty.id },
  });
  const otherService = await db.service.create({
    data: { name: "Acne", slug: `acne-${uid()}`, category: "Skin & Dermatology", description: "Acne care", durationMinutes: 30, startingPrice: 70, specialistLabel: "Dermatologist", specialtyId: other.id },
  });
  const admin = await db.user.create({ data: { email: `admin-${uid()}@test.example`, name: "Admin", role: "ADMIN", passwordHash: HASH } });

  return {
    specialtyId: specialty.id,
    otherSpecialtyId: other.id,
    serviceId: service.id,
    otherServiceId: otherService.id,
    doctor: await createDoctor(db, specialty.id, { name: "Dr. Alpha" }),
    otherDoctor: await createDoctor(db, specialty.id, { name: "Dr. Beta" }),
    patientA: await createPatient(db, "Alice Patient"),
    patientB: await createPatient(db, "Bob Patient"),
    admin: { id: admin.id, role: "ADMIN", name: "Admin", email: admin.email },
  };
}

/** A date `daysAhead` days out (default ≥ 3 so it is comfortably in the future), independent of weekday. */
export function futureDate(daysAhead = 3): string {
  return addDays(clinicToday(), daysAhead);
}

/** Next date on or after `daysAhead` that falls on the given weekday (0=Sun). */
export function futureWeekday(weekday: number, daysAhead = 3): string {
  let d = futureDate(daysAhead);
  while (dayOfWeek(d) !== weekday) d = addDays(d, 1);
  return d;
}

export function bookingInput(w: World, over: Partial<{ date: string; startTime: string; consultationType: "IN_PERSON" | "ONLINE"; doctorId: string; serviceId: string }> = {}) {
  return {
    doctorId: over.doctorId ?? w.doctor.id,
    serviceId: over.serviceId ?? w.serviceId,
    date: over.date ?? futureDate(),
    startTime: over.startTime ?? "10:00",
    consultationType: over.consultationType ?? ("IN_PERSON" as const),
    patientName: "Test Patient",
  };
}
