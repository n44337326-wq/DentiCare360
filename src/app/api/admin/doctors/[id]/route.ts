import { apiHandler, json, parseJson } from "@/lib/http";
import { requireRole } from "@/lib/guards";
import { adminDoctorUpdateSchema } from "@/lib/validation";
import { updateDoctorAsAdmin } from "@/services/catalog";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = apiHandler<Ctx>(async (req, { params }) => {
  const admin = await requireRole("ADMIN");
  const { id } = await params;
  const input = await parseJson(req, adminDoctorUpdateSchema);
  return json({ doctor: await updateDoctorAsAdmin(id, input, admin.id) });
});
