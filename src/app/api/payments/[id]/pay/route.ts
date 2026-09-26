import { apiHandler, clientIp, json } from "@/lib/http";
import { requireRole } from "@/lib/guards";
import { enforceRateLimit } from "@/lib/rate-limit";
import { payForAppointment } from "@/services/payments";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Settles a pending consultation fee through the payment provider integration.
 * The request carries NO card data — see `PaymentProvider` in services/payments.
 */
export const POST = apiHandler<Ctx>(async (req, { params }) => {
  const user = await requireRole("PATIENT");
  enforceRateLimit({ scope: "payment", key: user.id, limit: 10, windowMs: 60_000 });
  const { id } = await params;
  return json({ payment: await payForAppointment(user, id, clientIp(req)) });
});
