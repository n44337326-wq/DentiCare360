import { apiHandler, clientIp, json, parseJson } from "@/lib/http";
import { requireRole } from "@/lib/guards";
import { createDoctorSchema } from "@/lib/admin-validation";
import { createDoctor } from "@/services/admin";

/** Admin: create a doctor account (login + profile + default schedule). */
export const POST = apiHandler(async (req) => {
  const admin = await requireRole("ADMIN");
  const input = await parseJson(req, createDoctorSchema);
  return json({ doctor: await createDoctor(admin, input, clientIp(req)) }, 201);
});
