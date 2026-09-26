import { apiHandler, json } from "@/lib/http";
import { requireUser } from "@/lib/guards";
import { listAllPayments, listPaymentsForPatient } from "@/services/payments";

/** Transaction history — a patient sees only their own; admins see all. */
export const GET = apiHandler(async () => {
  const user = await requireUser();
  if (user.role === "ADMIN") return json({ payments: await listAllPayments() });
  if (user.role === "PATIENT" && user.patientId) return json({ payments: await listPaymentsForPatient(user.patientId) });
  return json({ payments: [] });
});
