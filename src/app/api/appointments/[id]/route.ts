import { apiHandler, clientIp, json, parseJson } from "@/lib/http";
import { requireUser } from "@/lib/guards";
import { appointmentActionSchema } from "@/lib/validation";
import { applyAppointmentAction, getAppointmentForUser } from "@/services/appointments";

type Ctx = { params: Promise<{ id: string }> };

export const GET = apiHandler<Ctx>(async (_req, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  return json({ appointment: await getAppointmentForUser(user, id) });
});

/** Lifecycle actions: cancel, reschedule, accept, complete, no_show, note. Authorization lives in the service. */
export const PATCH = apiHandler<Ctx>(async (req, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  const action = await parseJson(req, appointmentActionSchema);
  return json({ appointment: await applyAppointmentAction(user, id, action, clientIp(req)) });
});
