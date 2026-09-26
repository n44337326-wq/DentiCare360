import { z } from "zod";
import { apiHandler, json, parseJson } from "@/lib/http";
import { requireUser } from "@/lib/guards";
import { countUnread, listNotificationsForUser, markAllRead, markRead } from "@/services/notifications";

/** Only ever the caller's own notifications. */
export const GET = apiHandler(async () => {
  const user = await requireUser();
  const [notifications, unread] = await Promise.all([listNotificationsForUser(user.id), countUnread(user.id)]);
  return json({ notifications, unread });
});

const patchSchema = z.union([z.object({ id: z.string().min(1).max(64) }), z.object({ all: z.literal(true) })]);

export const PATCH = apiHandler(async (req) => {
  const user = await requireUser();
  const input = await parseJson(req, patchSchema);
  if ("all" in input) await markAllRead(user.id);
  else await markRead(user.id, input.id);
  return json({ ok: true });
});
