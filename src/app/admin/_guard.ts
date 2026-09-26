import { redirect } from "next/navigation";
import { getSessionUser, type SessionUser } from "@/lib/guards";

/** Server-side guard for every admin page: role ADMIN, otherwise sign in. */
export async function requireAdminUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/login");
  return user;
}
