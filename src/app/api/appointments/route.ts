import { apiHandler, clientIp, json, parseJson } from "@/lib/http";
import { requireRole, requireUser } from "@/lib/guards";
import { enforceRateLimit } from "@/lib/rate-limit";
import { bookingSchema } from "@/lib/validation";
import { bookAppointment, listAppointmentsForUser } from "@/services/appointments";

/** The caller's appointments — scoped by role on the server (patient: own, doctor: own patients, admin: all). */
export const GET = apiHandler(async () => {
  const user = await requireUser();
  return json({ appointments: await listAppointmentsForUser(user) });
});

export const POST = apiHandler(async (req) => {
  const user = await requireRole("PATIENT");
  enforceRateLimit({ scope: "booking", key: user.id, limit: 15, windowMs: 60_000 });
  const input = await parseJson(req, bookingSchema);
  const appointment = await bookAppointment(user, input, clientIp(req));
  return json({ appointment }, 201);
});
