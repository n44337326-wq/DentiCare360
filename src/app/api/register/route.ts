import { apiHandler, clientIp, json, parseJson } from "@/lib/http";
import { registerSchema } from "@/lib/validation";
import { registerPatient } from "@/services/users";

export const POST = apiHandler(async (req) => {
  const input = await parseJson(req, registerSchema);
  const user = await registerPatient(input, clientIp(req));
  return json({ id: user.id, email: user.email }, 201);
});
