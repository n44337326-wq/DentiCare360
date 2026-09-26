import { apiHandler, json } from "@/lib/http";
import { getSessionUser } from "@/lib/guards";
import { getConversationMessages } from "@/services/ai";

type Ctx = { params: Promise<{ id: string }> };

/** Resume a conversation. Guests must present the key returned when it was created. */
export const GET = apiHandler<Ctx>(async (req, { params }) => {
  const user = await getSessionUser();
  const { id } = await params;
  const guestKey = new URL(req.url).searchParams.get("guestKey") ?? undefined;
  return json(await getConversationMessages(user, id, guestKey));
});
