import { apiHandler, json, parseJson } from "@/lib/http";
import { requireRole } from "@/lib/guards";
import { serviceUpdateSchema } from "@/lib/validation";
import { updateService } from "@/services/catalog";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = apiHandler<Ctx>(async (req, { params }) => {
  const admin = await requireRole("ADMIN");
  const { id } = await params;
  const input = await parseJson(req, serviceUpdateSchema);
  return json({ service: await updateService(id, input, admin.id) });
});
