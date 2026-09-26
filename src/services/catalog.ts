import { db } from "@/database/client";
import { NotFoundError } from "@/lib/errors";
import type { ServiceInput } from "@/lib/validation";
import type { Doctor, Service, Specialty } from "@/types";
import { audit } from "@/services/audit";
import { doctorInclude, toDoctor, toService, toSpecialty } from "@/services/mappers";

const SPECIALTY_ORDER = ["dental", "dermatology", "skin-face", "general", "pediatric", "preventive"];

export async function listSpecialties(): Promise<Specialty[]> {
  const rows = await db.specialty.findMany();
  return rows.map(toSpecialty).sort((a, b) => SPECIALTY_ORDER.indexOf(a.slug) - SPECIALTY_ORDER.indexOf(b.slug));
}

export async function listServices(options: { includeInactive?: boolean } = {}): Promise<Service[]> {
  const rows = await db.service.findMany({
    where: options.includeInactive ? {} : { isActive: true },
    include: { specialty: { select: { slug: true } } },
    orderBy: [{ createdAt: "asc" }, { name: "asc" }],
  });
  return rows.map(toService);
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  const row = await db.service.findUnique({ where: { slug }, include: { specialty: { select: { slug: true } } } });
  return row ? toService(row) : null;
}

export async function listDoctors(options: { includeInactive?: boolean } = {}): Promise<Doctor[]> {
  const rows = await db.doctor.findMany({
    where: options.includeInactive ? {} : { isActive: true },
    include: doctorInclude,
    orderBy: [{ rating: "desc" }, { createdAt: "asc" }],
  });
  return rows.map(toDoctor);
}

export async function getDoctor(id: string): Promise<Doctor | null> {
  const row = await db.doctor.findUnique({ where: { id }, include: doctorInclude });
  return row ? toDoctor(row) : null;
}

/** Public-facing lookup: an inactive (deactivated) doctor is treated as not found. */
export async function getActiveDoctor(id: string): Promise<Doctor | null> {
  const doctor = await getDoctor(id);
  return doctor && doctor.isActive ? doctor : null;
}

// ---------------- Admin management ----------------

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createService(input: ServiceInput, actorId: string): Promise<Service> {
  const specialty = await db.specialty.findUnique({ where: { slug: input.specialtySlug } });
  if (!specialty) throw new NotFoundError("Specialty not found.");

  const base = slugify(input.name);
  let slug = base;
  for (let i = 2; await db.service.findUnique({ where: { slug } }); i++) slug = `${base}-${i}`;

  const row = await db.service.create({
    data: {
      name: input.name,
      slug,
      category: input.category,
      description: input.description,
      durationMinutes: input.durationMinutes,
      startingPrice: input.startingPrice,
      specialistLabel: input.suitableSpecialist,
      isActive: input.isActive,
      specialtyId: specialty.id,
    },
    include: { specialty: { select: { slug: true } } },
  });
  await audit({ userId: actorId, action: "SERVICE_CREATED", entityType: "Service", entityId: row.id });
  return toService(row);
}

export async function updateService(id: string, input: Partial<ServiceInput>, actorId: string): Promise<Service> {
  const existing = await db.service.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Service not found.");

  let specialtyId: string | undefined;
  if (input.specialtySlug) {
    const specialty = await db.specialty.findUnique({ where: { slug: input.specialtySlug } });
    if (!specialty) throw new NotFoundError("Specialty not found.");
    specialtyId = specialty.id;
  }

  const row = await db.service.update({
    where: { id },
    data: {
      name: input.name,
      category: input.category,
      description: input.description,
      durationMinutes: input.durationMinutes,
      startingPrice: input.startingPrice,
      specialistLabel: input.suitableSpecialist,
      isActive: input.isActive,
      specialtyId,
    },
    include: { specialty: { select: { slug: true } } },
  });
  await audit({
    userId: actorId,
    action: "SERVICE_UPDATED",
    entityType: "Service",
    entityId: id,
    metadata: { fields: Object.keys(input) },
  });
  return toService(row);
}

export interface AdminDoctorPatch {
  consultationFee?: number;
  isActive?: boolean;
  isTemporarilyUnavailable?: boolean;
  unavailableReason?: string;
  autoConfirm?: boolean;
  location?: string;
  supportsOnline?: boolean;
  supportsInPerson?: boolean;
}

export async function updateDoctorAsAdmin(id: string, input: AdminDoctorPatch, actorId: string): Promise<Doctor> {
  const existing = await db.doctor.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Doctor not found.");
  const row = await db.doctor.update({
    where: { id },
    data: {
      ...input,
      unavailableReason: input.isTemporarilyUnavailable === false ? null : input.unavailableReason,
    },
    include: doctorInclude,
  });
  await audit({
    userId: actorId,
    action: "DOCTOR_UPDATED_BY_ADMIN",
    entityType: "Doctor",
    entityId: id,
    metadata: { fields: Object.keys(input) },
  });
  return toDoctor(row);
}
