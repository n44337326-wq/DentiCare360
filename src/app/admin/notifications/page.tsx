import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { NotificationsList } from "@/components/shared/notifications-list";
import { SendRemindersButton } from "@/components/admin/send-reminders-button";
import { formatDateTime } from "@/components/admin/format";
import { PageHeader } from "@/components/doctor/page-header";
import { listAllNotifications } from "@/services/notifications";
import { requireAdminUser } from "@/app/admin/_guard";

export const metadata = { title: "Notifications — Admin" };
export const dynamic = "force-dynamic";

type SystemNotification = Awaited<ReturnType<typeof listAllNotifications>>[number];

const ROLE_LABEL = { PATIENT: "Patient", DOCTOR: "Doctor", ADMIN: "Admin" } as const;
const TYPE_LABEL: Record<string, string> = {
  APPOINTMENT_CONFIRMED: "Confirmed",
  APPOINTMENT_REMINDER: "Reminder",
  APPOINTMENT_RESCHEDULED: "Rescheduled",
  APPOINTMENT_CANCELLED: "Cancelled",
  DOCTOR_AVAILABILITY: "Availability",
  GENERAL: "General",
};

export default async function AdminNotificationsPage() {
  await requireAdminUser();

  let items: SystemNotification[] | null = null;
  try {
    items = await listAllNotifications(100);
  } catch (err) {
    console.error("[admin/notifications] failed to load", err);
  }

  return (
    <div className="space-y-10">
      <div>
        <PageHeader title="Notifications" description="System-wide notifications and reminders." />
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Appointment reminders</CardTitle>
            <p className="text-sm text-slate-600">
              Sends a reminder to every patient whose confirmed appointment starts within the next 24 hours and who has not been reminded yet.
            </p>
          </CardHeader>
          <CardContent>
            <SendRemindersButton />
          </CardContent>
        </Card>

        <section aria-labelledby="all-notifs">
          <h2 id="all-notifs" className="mb-3 text-lg font-semibold text-navy">Recent notifications across the clinic</h2>
          {!items ? (
            <ErrorState message="We couldn't load the notifications. Please refresh the page to try again." />
          ) : items.length === 0 ? (
            <EmptyState icon={Bell} title="No notifications yet" description="Notifications appear here as bookings and changes happen." />
          ) : (
            <>
              <div className="hidden overflow-x-auto rounded-xl border border-border bg-white md:block">
                <table className="w-full min-w-[44rem] text-left text-sm">
                  <caption className="sr-only">Recent notifications</caption>
                  <thead className="bg-soft-blue text-xs uppercase tracking-wide text-slate-700">
                    <tr>
                      <th scope="col" className="px-4 py-3">Recipient</th>
                      <th scope="col" className="px-4 py-3">Type</th>
                      <th scope="col" className="px-4 py-3">Message</th>
                      <th scope="col" className="px-4 py-3">Sent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border align-top">
                    {items.map((n) => (
                      <tr key={n.id}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-navy">{n.recipientName}</p>
                          <Badge variant="outline" className="mt-1">{ROLE_LABEL[n.recipientRole]}</Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{TYPE_LABEL[n.type] ?? n.type}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-navy">{n.title}</p>
                          <p className="text-slate-700">{n.message}</p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-700">{formatDateTime(n.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="space-y-3 md:hidden">
                {items.map((n) => (
                  <li key={n.id}>
                    <Card>
                      <CardContent className="space-y-1.5 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium text-navy">{n.recipientName}</p>
                          <Badge variant="outline">{ROLE_LABEL[n.recipientRole]}</Badge>
                        </div>
                        <p className="text-sm font-medium text-navy">{n.title}</p>
                        <p className="text-sm text-slate-700">{n.message}</p>
                        <p className="text-xs text-slate-600">{TYPE_LABEL[n.type] ?? n.type} · {formatDateTime(n.createdAt)}</p>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      <section aria-labelledby="own-notifs">
        <h2 id="own-notifs" className="mb-1 text-lg font-semibold text-navy">Your notifications</h2>
        <p className="mb-3 text-sm text-slate-600">Messages sent to you, including contact-form submissions.</p>
        <NotificationsList limit={10} />
      </section>
    </div>
  );
}
