import Link from "next/link";
import {
  Bot,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  Clock,
  DollarSign,
  ShieldAlert,
  Stethoscope,
  Users,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { formatShortDate, formatTime12 } from "@/lib/time";
import type { AiConversationSummary, Appointment } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { AppointmentStatusBadge, UrgencyBadge } from "@/components/shared/status-badge";
import { ColumnChart } from "@/components/admin/charts";
import { PageHeader } from "@/components/doctor/page-header";
import { StatCard } from "@/components/doctor/stat-card";
import { listAllAppointments } from "@/services/appointments";
import { listAllConversations } from "@/services/ai";
import { getOverviewStats, getReports } from "@/services/reports";
import { requireAdminUser } from "@/app/admin/_guard";
import { chartDayLabel, formatDateTime } from "@/components/admin/format";

export const metadata = { title: "Overview — Admin" };
export const dynamic = "force-dynamic";

async function load(user: Awaited<ReturnType<typeof requireAdminUser>>) {
  try {
    const [stats, reports, appointments, conversations] = await Promise.all([
      getOverviewStats(),
      getReports(),
      listAllAppointments(),
      listAllConversations(user),
    ]);
    return { stats, reports, appointments, conversations };
  } catch (err) {
    console.error("[admin/overview] failed to load", err);
    return null;
  }
}

export default async function AdminOverviewPage() {
  const user = await requireAdminUser();
  const data = await load(user);

  if (!data) {
    return (
      <div>
        <PageHeader title="Overview" />
        <ErrorState message="We couldn't load the overview. Please refresh the page to try again." />
      </div>
    );
  }

  const { stats, reports } = data;
  const recent: Appointment[] = [...data.appointments].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);
  const urgent: AiConversationSummary[] = data.conversations
    .filter((c) => c.urgency === "HIGH" || c.urgency === "EMERGENCY")
    .slice(0, 6);

  return (
    <div className="space-y-8">
      <PageHeader title="Overview" description="Clinic-wide activity at a glance." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={Stethoscope} label="Active doctors" value={stats.activeDoctors} />
        <StatCard icon={Users} label="Patients" value={stats.patients} tone="navy" />
        <StatCard icon={CalendarClock} label="Appointments today" value={stats.appointmentsToday} tone="green" />
        <StatCard icon={CalendarCheck} label="Upcoming appointments" value={stats.upcomingAppointments} />
        <StatCard icon={CheckCircle2} label="Completed appointments" value={stats.completedAppointments} tone="green" />
        <StatCard icon={DollarSign} label="Revenue (paid)" value={formatCurrency(stats.revenuePaid)} tone="green" />
        <StatCard icon={Clock} label="Revenue (pending)" value={formatCurrency(stats.revenuePending)} tone="amber" />
        <StatCard icon={Bot} label="AI conversations" value={stats.aiConversations} tone="navy" />
        <StatCard icon={ShieldAlert} label="AI urgent flags" value={stats.aiEmergencyFlags} tone={stats.aiEmergencyFlags ? "red" : "green"} hint="High urgency or emergency" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Appointments — next 14 days</CardTitle>
          <p className="text-sm text-slate-600">Active appointments per day (pending, confirmed and rescheduled).</p>
        </CardHeader>
        <CardContent>
          <ColumnChart
            caption="Active appointments per day for the next 14 days"
            data={reports.next14Days.map((d) => ({ label: formatShortDate(d.date), short: chartDayLabel(d.date), value: d.count }))}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <section aria-labelledby="recent-appts">
          <h2 id="recent-appts" className="mb-3 text-lg font-semibold text-navy">Recent appointments</h2>
          {recent.length === 0 ? (
            <EmptyState title="No appointments yet" description="Bookings will appear here as patients make them." />
          ) : (
            <ul className="space-y-2">
              {recent.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-white px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-navy">
                      {a.patientName} <span className="text-slate-500">→</span> {a.doctorName}
                    </p>
                    <p className="text-sm text-slate-600">
                      {a.serviceName} · {formatDate(a.date)}, {formatTime12(a.startTime)}
                    </p>
                  </div>
                  <AppointmentStatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/appointments" className="mt-3 inline-block text-sm font-medium text-cyan hover:underline">
            All appointments
          </Link>
        </section>

        <section aria-labelledby="urgent-ai">
          <h2 id="urgent-ai" className="mb-3 text-lg font-semibold text-navy">AI conversations flagged urgent</h2>
          {urgent.length === 0 ? (
            <EmptyState icon={ShieldAlert} title="Nothing flagged" description="Conversations the assistant rates as urgent or emergency will be listed here." />
          ) : (
            <ul className="space-y-2">
              {urgent.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/admin/ai-conversations/${c.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-white px-4 py-3 transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-navy">{c.patientName ?? "Guest"}</p>
                      <p className="text-sm text-slate-600">
                        {c.specialtyLabel ?? "No specialty identified"} · {c.messageCount} messages · {formatDateTime(c.updatedAt)}
                      </p>
                    </div>
                    <UrgencyBadge urgency={c.urgency} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/ai-conversations" className="mt-3 inline-block text-sm font-medium text-cyan hover:underline">
            All AI conversations
          </Link>
        </section>
      </div>
    </div>
  );
}
