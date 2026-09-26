import Link from "next/link";
import { CalendarCheck, CalendarClock, Inbox, Users } from "lucide-react";
import { clinicToday, dayOfWeek } from "@/lib/time";
import type { Appointment, Doctor } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, ErrorState, InlineAlert } from "@/components/shared/states";
import { AppointmentSummaryItem } from "@/components/doctor/appointment-summary-item";
import { AvailabilityStatusCard } from "@/components/doctor/availability-status-card";
import { buildDoctorDashboard } from "@/components/doctor/dashboard-data";
import { FollowUpsCard } from "@/components/doctor/followups-card";
import { PageHeader } from "@/components/doctor/page-header";
import { StatCard } from "@/components/doctor/stat-card";
import { getDoctor } from "@/services/catalog";
import { listAppointmentsForDoctor } from "@/services/appointments";
import { getDoctorCalendar } from "@/services/scheduling";
import { requireDoctorUser } from "@/app/doctor/_guard";

export const metadata = { title: "Dashboard — Doctor Portal" };
export const dynamic = "force-dynamic";

async function loadDashboard(doctorId: string): Promise<{ doctor: Doctor; appointments: Appointment[]; next: { date: string; startTime: string } | null } | null> {
  try {
    const doctor = await getDoctor(doctorId);
    if (!doctor) return null;
    const [appointments, calendar] = await Promise.all([listAppointmentsForDoctor(doctorId), getDoctorCalendar(doctor)]);
    const n = calendar.nextAvailable;
    return { doctor, appointments, next: n ? { date: n.date, startTime: n.slot.startTime } : null };
  } catch (err) {
    console.error("[doctor/dashboard] failed to load", err);
    return null;
  }
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`sec-${title.replace(/\W+/g, "-")}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id={`sec-${title.replace(/\W+/g, "-")}`} className="text-lg font-semibold text-navy">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default async function DoctorDashboardPage() {
  const user = await requireDoctorUser();
  const data = await loadDashboard(user.doctorId);

  if (!data) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <ErrorState message="We couldn't load your dashboard. Please refresh the page to try again." />
      </div>
    );
  }

  const { doctor, appointments, next } = data;
  const today = clinicToday();
  const d = buildDoctorDashboard(appointments, today);
  const workingToday =
    !doctor.holidays.includes(today) && doctor.availability.some((a) => a.isActive && a.dayOfWeek === dayOfWeek(today));

  return (
    <div className="space-y-8">
      <PageHeader title={`Welcome, ${doctor.name}`} description={`${doctor.specialtyName} · ${doctor.location || "DentiCare360"}`} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CalendarClock} label="Today's appointments" value={d.today.filter((a) => a.status !== "NO_SHOW").length} />
        <StatCard icon={CalendarCheck} label="Next 7 days" value={d.upcoming.length} tone="navy" />
        <StatCard icon={Inbox} label="Pending requests" value={d.requests.length} tone={d.requests.length ? "amber" : "green"} />
        <StatCard icon={Users} label="Patients" value={d.patientCount} tone="green" hint="Distinct patients seen or booked" />
      </div>

      {d.requests.length > 0 && (
        <InlineAlert variant="warning" title={`${d.requests.length} booking request${d.requests.length === 1 ? " needs" : "s need"} your confirmation`}>
          Patients are waiting for you to accept.{" "}
          <Link href="/doctor/appointments" className="font-medium underline">
            Review all requests
          </Link>
        </InlineAlert>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-8">
          <Section title="Today" action={<Link href="/doctor/appointments" className="text-sm font-medium text-cyan hover:underline">All appointments</Link>}>
            {d.today.length === 0 ? (
              <EmptyState title="No appointments today" description="New bookings for today will appear here." />
            ) : (
              <ul className="space-y-2">
                {d.today.map((a) => (
                  <li key={a.id}>
                    <AppointmentSummaryItem appointment={a} />
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {d.requests.length > 0 && (
            <Section title="Requests awaiting acceptance">
              <ul className="space-y-2">
                {d.requests.slice(0, 5).map((a) => (
                  <li key={a.id}>
                    <AppointmentSummaryItem appointment={a} showDate />
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title="Upcoming — next 7 days">
            {d.upcoming.length === 0 ? (
              <EmptyState title="Nothing scheduled this week" description="Appointments in the coming seven days will show up here." />
            ) : (
              <ul className="space-y-2">
                {d.upcoming.map((a) => (
                  <li key={a.id}>
                    <AppointmentSummaryItem appointment={a} showDate />
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        <div className="space-y-6">
          <AvailabilityStatusCard doctor={doctor} workingToday={workingToday} next={next} />
          <FollowUpsCard followUps={d.followUps} />
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Quick links</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 text-sm">
              <Link href="/doctor/availability" className="rounded-lg px-2 py-1.5 text-navy hover:bg-soft-blue">Working hours and time off</Link>
              <Link href="/doctor/notifications" className="rounded-lg px-2 py-1.5 text-navy hover:bg-soft-blue">Notifications</Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
