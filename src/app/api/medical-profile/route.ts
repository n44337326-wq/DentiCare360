import { apiHandler, clientIp, json, parseJson } from "@/lib/http";
import { requirePatientId, requireRole } from "@/lib/guards";
import { medicalProfileSchema } from "@/lib/validation";
import { getMedicalProfile, saveMedicalProfile } from "@/services/users";

export const GET = apiHandler(async () => {
  const user = await requireRole("PATIENT");
  return json({ profile: await getMedicalProfile(requirePatientId(user)) });
});

export const PUT = apiHandler(async (req) => {
  const user = await requireRole("PATIENT");
  const input = await parseJson(req, medicalProfileSchema);
  return json({ profile: await saveMedicalProfile(user, requirePatientId(user), input, clientIp(req)) });
});
