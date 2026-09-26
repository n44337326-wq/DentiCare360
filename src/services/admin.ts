import bcrypt from "bcryptjs";
import { db, Prisma } from "@/database/client";
import type { CreateDoctorInput } from "@/lib/admin-validation";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import type { SessionUser } from "@/lib/guards";
import type { Doctor } from "@/types";
import { audit } from "@/services/audit";
import { doctorInclude, toDoctor } from "@/services/mappers";

const BCRYPT_COST = 12;

function assertAdmin(user: SessionUser) {
  if (user.role !== "ADMIN") throw new ForbiddenError();
}

/** Default weekly template for a new doctor: Monday to Friday 09:00–17:00 with a 13:00–14:00 break. */
const DEFAULT_WEEK = [1, 2, 3, 4, 5].map((dayOfWeek) => ({
  dayOfWeek,
  isActive: true,
  startTime: "09:00",
  endTime: "17:00",
  breakStart: "13:00",
  breakEnd: "14:00",
}));

/**
 * Creates a doctor account: the login (`User`, role DOCTOR, bcrypt-hashed
 * password), the public profile (`Doctor`) and a default working week, all in
 * one transaction so a half-created doctor can never exist. Admin only.
 */
export async function createDoctor(user: SessionUser, input: CreateDoctorInput, ip?: string): Promise<Doctor> {
  assertAdmin(user);
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);

  try {
    const created = await db.$transaction(async (tx) => {
      if (await tx.user.findUnique({ where: { email: input.email }, select: { id: true } })) {
        throw new ConflictError("An account with this email already exists.", "EMAIL_TAKEN");
      }
      const specialty = await tx.specialty.findUnique({ where: { slug: input.specialtySlug } });
      if (!specialty) throw new NotFoundError("Specialty not found.");

      const row = await tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          name: input.name,
          role: "DOCTOR",
          doctor: {
            create: {
              specialtyId: specialty.id,
              title: input.title,
              bio: input.bio,
              qualifications: input.qualifications,
              areasOfExpertise: input.areasOfExpertise,
              languages: input.languages,
              experienceYears: input.experienceYears,
              consultationFee: input.consultationFee,
              location: input.location ?? null,
              supportsOnline: input.supportsOnline,
              supportsInPerson: input.supportsInPerson,
              availability: { create: DEFAULT_WEEK },
            },
          },
        },
        include: { doctor: { include: doctorInclude } },
      });
      await audit(
        { userId: user.id, action: "DOCTOR_CREATED", entityType: "Doctor", entityId: row.doctor!.id, ipAddress: ip },
        tx
      );
      return row.doctor!;
    });
    return toDoctor(created);
  } catch (err) {
    // Two admins creating the same email at once: the unique index is the backstop.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new ConflictError("An account with this email already exists.", "EMAIL_TAKEN");
    }
    throw err;
  }
}

export interface DatabaseStatus {
  ok: boolean;
  latencyMs?: number;
}

/** Trivial round-trip used by the admin settings panel. Never throws. */
export async function getDatabaseStatus(): Promise<DatabaseStatus> {
  const started = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    return { ok: true, latencyMs: Date.now() - started };
  } catch {
    return { ok: false };
  }
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  userName: string | null;
  userEmail: string | null;
  ipAddress: string | null;
  createdAt: string;
}

/** Most recent audit entries. `metadata` is deliberately never selected: it may hold sensitive detail. Admin only. */
export async function listAuditLogs(user: SessionUser, limit = 50): Promise<AuditLogEntry[]> {
  assertAdmin(user);
  const rows = await db.auditLog.findMany({
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      ipAddress: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 200),
  });
  return rows.map((r) => ({
    id: r.id,
    action: r.action,
    entityType: r.entityType,
    entityId: r.entityId,
    userName: r.user?.name ?? null,
    userEmail: r.user?.email ?? null,
    ipAddress: r.ipAddress,
    createdAt: r.createdAt.toISOString(),
  }));
}
