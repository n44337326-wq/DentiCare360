import { formatCurrency } from "@/lib/utils";
import { formatShortDate } from "@/lib/time";
import type { AppointmentStatus, UrgencyLevel } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/shared/states";
import { BarChart, ColumnChart } from "@/components/admin/charts";
import { chartDayLabel } from "@/components/admin/format";
import { PageHeader } from "@/components/doctor/page-header";
import { getReports, type Reports } from "@/services/reports";
import { requireAdminUser } from "@/app/admin/_guard";

export const metadata = { title: "Reports — Admin" };
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  PENDING: "Awaiting confirmation",
  CONFIRMED: "Confirmed",
  RESCHEDULED: "Rescheduled",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No-show",
};
const URGENCY_ORDER: UrgencyLevel[] = ["LOW", "MODERATE", "HIGH", "EMERGENCY"];
const URGENCY_LABEL: Record<UrgencyLevel, string> = { LOW: "Routine", MODERATE: "Moderate", HIGH: "Urgent", EMERGENCY: "Emergency flagged" };

function ReportCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <p className="text-sm text-slate-600">{description}</p>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default async function AdminReportsPage() {
  await requireAdminUser();

  let reports: Reports | null = null;
  try {
    reports = await getReports();
  } catch (err) {
    console.error("[admin/reports] failed to load", err);
  }

  if (!reports) {
    return (
      <div>
        <PageHeader title="Reports" />
        <ErrorState message="We couldn't load the reports. Please refresh the page to try again." />
      </div>
    );
  }

  const r = reports;
  const urgency = URGENCY_ORDER.map((u) => ({ label: URGENCY_LABEL[u], value: r.aiUrgency.find((x) => x.urgency === u)?.count ?? 0 }));

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Appointments, revenue and AI assistant activity. Every chart has a data table underneath." />

      <ReportCard title="Appointments — next 14 days" description="Active appointments per day.">
        <ColumnChart
          caption="Active appointments per day for the next 14 days"
          data={r.next14Days.map((d) => ({ label: formatShortDate(d.date), short: chartDayLabel(d.date), value: d.count }))}
        />
      </ReportCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <ReportCard title="Appointments by status">
          <BarChart
            caption="Appointments by status"
            tone={0}
            data={r.byStatus.map((s) => ({ label: STATUS_LABEL[s.status], value: s.count }))}
            empty="No appointments yet."
          />
        </ReportCard>
        <ReportCard title="Appointments by specialty">
          <BarChart caption="Appointments by specialty" tone={1} data={r.bySpecialty.map((s) => ({ label: s.name, value: s.count }))} empty="No appointments yet." />
        </ReportCard>
      </div>

      <ReportCard title="By doctor" description="Appointment count with paid revenue in the data table.">
        <BarChart
          caption="Appointments by doctor"
          tone={2}
          data={r.byDoctor.map((d) => ({ label: d.name, value: d.count }))}
          valueHeader="Appointments"
          extraColumn={{ header: "Revenue (paid)", values: r.byDoctor.map((d) => formatCurrency(d.revenue)) }}
          empty="No appointments yet."
        />
        {r.byDoctor.length > 0 && (
          <p className="mt-3 text-sm text-slate-700">
            Total paid revenue: <strong className="text-navy">{formatCurrency(r.byDoctor.reduce((s, d) => s + d.revenue, 0))}</strong>
          </p>
        )}
      </ReportCard>

      <ReportCard title="AI conversations by urgency" description="How the AI Health Assistant rated patient-reported symptoms. Not a diagnosis.">
        <BarChart caption="AI conversations by urgency" tone={3} data={urgency} empty="No AI conversations yet." />
      </ReportCard>
    </div>
  );
}
