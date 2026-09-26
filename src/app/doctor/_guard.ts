import { redirect } from "next/navigation";
import { getSessionUser, type SessionUser } from "@/lib/guards";

/** Server-side guard for every doctor page: role DOCTOR with a linked doctor profile, otherwise sign in. */
export async function requireDoctorUser(): Promise<SessionUser & { doctorId: string }> {
  const user = await getSessionUser();
  if (!user || user.role !== "DOCTOR" || !user.doctorId) redirect("/login");
  return { ...user, doctorId: user.doctorId };
}
