import { db, type Db } from "@/database/client";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import type { NotificationItem, NotificationType } from "@/types";
import { toNotification } from "@/services/mappers";

/** A Prisma client or interactive-transaction client — both expose `notification`. */
type NotificationClient = Pick<Db, "notification">;

export async function notifyUser(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  client: NotificationClient = db
) {
  return client.notification.create({ data: { userId, type, title, message } });
}

export async function listNotificationsForUser(userId: string, limit = 50): Promise<NotificationItem[]> {
  const rows = await db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(toNotification);
}

export async function countUnread(userId: string): Promise<number> {
  return db.notification.count({ where: { userId, isRead: false } });
}

export async function markRead(userId: string, id: string): Promise<void> {
  const n = await db.notification.findUnique({ where: { id } });
  if (!n) throw new NotFoundError("Notification not found.");
  if (n.userId !== userId) throw new ForbiddenError();
  await db.notification.update({ where: { id }, data: { isRead: true } });
}

export async function markAllRead(userId: string): Promise<void> {
  await db.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
}

/** Admin view of recent notifications across all users. */
export async function listAllNotifications(limit = 100) {
  const rows = await db.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: { select: { name: true, role: true } } },
  });
  return rows.map((n) => ({ ...toNotification(n), recipientName: n.user.name, recipientRole: n.user.role }));
}
