import { timingSafeEqual } from "node:crypto";
import { apiHandler, json } from "@/lib/http";
import { getSessionUser } from "@/lib/guards";
import { ForbiddenError } from "@/lib/errors";
import { sendDueReminders } from "@/services/appointments";

function validCronSecret(header: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || !header) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Sends reminders for appointments starting within 24 hours. Callable by an
 * admin session, or by a scheduler presenting `Authorization: Bearer $CRON_SECRET`.
 */
export const POST = apiHandler(async (req) => {
  const user = await getSessionUser();
  if (user?.role !== "ADMIN" && !validCronSecret(req.headers.get("authorization"))) throw new ForbiddenError();
  return json({ sent: await sendDueReminders(24) });
});
