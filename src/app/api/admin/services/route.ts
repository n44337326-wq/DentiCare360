import { apiHandler, json, parseJson } from "@/lib/http";
import { requireRole } from "@/lib/guards";
import { serviceInputSchema } from "@/lib/validation";
import { createService } from "@/services/catalog";

export const POST = apiHandler(async (req) => {
  const admin = await requireRole("ADMIN");
  const input = await parseJson(req, serviceInputSchema);
  return json({ service: await createService(input, admin.id) }, 201);
});
