import { apiHandler, clientIp, json, parseJson } from "@/lib/http";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { requireUser, type SessionUser } from "@/lib/guards";
import { doctorScheduleSchema } from "@/lib/validation";
import { getDoctor } from "@/services/catalog";
import { saveDoctorSchedule } from "@/services/scheduling";

type Ctx = { params: Promise<{ id: string }> };

/** A doctor may manage only their own schedule; admins may manage any. */
function assertCanManage(user: SessionUser, doctorId: string) {
  const ok = user.role === "ADMIN" || (user.role === "DOCTOR" && user.doctorId === doctorId);
  if (!ok) throw new ForbiddenError("You can only manage your own schedule.");
}

export const GET = apiHandler<Ctx>(async (_req, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  assertCanManage(user, id);
  const doctor = await getDoctor(id);
  if (!doctor) throw new NotFoundError("Doctor not found.");
  return json({ doctor });
});

export const PUT = apiHandler<Ctx>(async (req, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  assertCanManage(user, id);
  const input = await parseJson(req, doctorScheduleSchema);
  return json(await saveDoctorSchedule(id, input, user.id, clientIp(req)));
});
