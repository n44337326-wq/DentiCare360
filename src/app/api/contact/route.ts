import { db } from "@/database/client";
import { contactSchema } from "@/lib/contact-schema";
import { apiHandler, clientIp, json, parseJson } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";

/**
 * Public contact form. Messages are delivered as in-app notifications to every
 * administrator. Rate limited per IP so the form can't be used to flood them.
 */
export const POST = apiHandler(async (req) => {
  enforceRateLimit({ scope: "contact", key: clientIp(req), limit: 5, windowMs: 60 * 60_000 });
  const input = await parseJson(req, contactSchema);

  const admins = await db.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
  const message = `From ${input.name} <${input.email}>. Subject: ${input.subject}. ${input.message.slice(0, 300)}`;

  if (admins.length > 0) {
    await db.notification.createMany({
      data: admins.map((a) => ({ userId: a.id, type: "GENERAL" as const, title: "New contact message", message })),
    });
  }

  return json({ ok: true }, 201);
});
