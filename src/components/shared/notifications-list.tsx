"use client";

import { Bell, CalendarCheck2, CalendarClock, CalendarX2, Clock, Stethoscope } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { useFetch } from "@/hooks/use-fetch";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/shared/states";
import { cn } from "@/lib/utils";
import type { NotificationItem, NotificationType } from "@/types";

const ICONS: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  APPOINTMENT_CONFIRMED: CalendarCheck2,
  APPOINTMENT_REMINDER: Clock,
  APPOINTMENT_RESCHEDULED: CalendarClock,
  APPOINTMENT_CANCELLED: CalendarX2,
  DOCTOR_AVAILABILITY: Stethoscope,
  GENERAL: Bell,
};

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** The signed-in user's own notifications (server-scoped), with mark-as-read. Used by every portal. */
export function NotificationsList({ limit }: { limit?: number }) {
  const { data, error, retry, mutate } = useFetch<{ notifications: NotificationItem[] }>("/api/notifications");
  const items = data?.notifications;

  async function markRead(id: string) {
    if (items) mutate({ notifications: items.map((n) => (n.id === id ? { ...n, isRead: true } : n)) });
    await apiFetch("/api/notifications", { method: "PATCH", json: { id } }).catch(() => retry());
    window.dispatchEvent(new Event("notifications:changed"));
  }

  async function markAllRead() {
    if (items) mutate({ notifications: items.map((n) => ({ ...n, isRead: true })) });
    await apiFetch("/api/notifications", { method: "PATCH", json: { all: true } }).catch(() => retry());
    window.dispatchEvent(new Event("notifications:changed"));
  }

  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (!items) return <SkeletonRows rows={3} />;
  if (items.length === 0) {
    return <EmptyState icon={Bell} title="You're all caught up" description="Appointment confirmations, reminders and schedule changes will appear here." />;
  }

  const shown = limit ? items.slice(0, limit) : items;
  const unread = items.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-3">
      {unread > 0 && !limit && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={markAllRead}>
            Mark all as read ({unread})
          </Button>
        </div>
      )}
      <ul className="space-y-2">
        {shown.map((n) => {
          const Icon = ICONS[n.type] ?? Bell;
          return (
            <li key={n.id}>
              <Card className={cn("transition-shadow hover:shadow-md", !n.isRead && "border-cyan/40 bg-cyan-light/40")}>
                <CardContent className="flex items-start gap-3 p-4">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-soft-blue text-navy">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-navy">
                        {n.title}
                        {!n.isRead && <span className="sr-only"> (unread)</span>}
                      </p>
                      <span className="shrink-0 text-xs text-muted">{timeAgo(n.createdAt)}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-muted">{n.message}</p>
                    {!n.isRead && (
                      <button
                        type="button"
                        onClick={() => markRead(n.id)}
                        className="mt-2 text-xs font-medium text-cyan hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
