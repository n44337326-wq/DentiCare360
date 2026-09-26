import { apiHandler, clientIp, json, parseJson } from "@/lib/http";
import { getSessionUser } from "@/lib/guards";
import { aiChatSchema } from "@/lib/validation";
import { handleChatTurn } from "@/services/ai";

/**
 * AI Health Assistant endpoint. Open to guests (so anyone can find the right
 * service) but rate-limited per user/IP, and conversations are only resumable
 * by their owner. No provider keys ever reach the browser.
 */
export const POST = apiHandler(async (req) => {
  const user = await getSessionUser();
  const input = await parseJson(req, aiChatSchema);
  return json(await handleChatTurn({ user, ip: clientIp(req), ...input }));
});
