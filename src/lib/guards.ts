import { db } from "@/database/client";
import { auth } from "@/lib/auth";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";
import type { Role } from "@/types";

export interface SessionUser {
  id: string;
  role: Role;
  name?: string | null;
  email?: string | null;
  doctorId?: string;
  patientId?: string;
}

/**
 * The signed-in user, or null. Never throws.
 *
 * The signed token only proves who signed in; the DATABASE stays authoritative.
 * A user who was deleted or deactivated is treated as signed out immediately
 * (not when the token eventually expires), and role / profile ids always come
 * from the database, so a stale or tampered token can't carry old privileges.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const row = await db.user.findUnique({
    where: { id: session.user.id },
    select: { isActive: true, role: true, name: true, email: true, doctor: { select: { id: true } }, patient: { select: { id: true } } },
  });
  if (!row || !row.isActive) return null;

  return { id: session.user.id, role: row.role, name: row.name, email: row.email, doctorId: row.doctor?.id, patientId: row.patient?.id };
}

/** Server-side authentication check — throws 401 if nobody is signed in. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

/** Server-side authorization check — throws 401/403 unless the user holds one of the roles. */
export async function requireRole<R extends Role>(...roles: R[]): Promise<SessionUser & { role: R }> {
  const user = await requireUser();
  if (!(roles as Role[]).includes(user.role)) throw new ForbiddenError();
  return user as SessionUser & { role: R };
}

export function requirePatientId(user: SessionUser): string {
  if (user.role !== "PATIENT" || !user.patientId) throw new ForbiddenError("A patient account is required.");
  return user.patientId;
}

export function requireDoctorId(user: SessionUser): string {
  if (user.role !== "DOCTOR" || !user.doctorId) throw new ForbiddenError("A doctor account is required.");
  return user.doctorId;
}
