import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/guards";
import { listAppointmentsForPatient } from "@/services/appointments";
import { listConversationsForPatient } from "@/services/ai";
import { listDocumentsForPatient } from "@/services/documents";
import { ErrorState } from "@/components/shared/states";
import { NotificationsList } from "@/components/shared/notifications-list";
import { groupAppointments } from "@/components/patient/appointment-utils";
import {
  AiConversationsSection,
  AppointmentRows,
  DocumentsSection,
  QuickActions,
  SectionHeading,
} from "@/components/patient/dashboard-sections";
import { loadSafe } from "@/components/patient/load-safe";
import { NextAppointmentCard } from "@/components/patient/next-appointment-card";

export const metadata = { title: "Patient dashboard — DentiCare360" };
export const dynamic = "force-dynamic";

export default async function PatientDashboardPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "PATIENT" || !user.patientId) redirect("/login");
  const patientId = user.patientId;

  const [appointments, conversations, documents] = await Promise.all([
    loadSafe("appointments", () => listAppointmentsForPatient(patientId)),
    loadSafe("AI conversations", () => listConversationsForPatient(patientId)),
    loadSafe("documents", () => listDocumentsForPatient(patientId)),
  ]);

  const groups = appointments.ok ? groupAppointments(appointments.data) : null;
  const upcoming = groups?.upcoming.map((v) => v.appointment) ?? [];
  const past = groups?.past.map((v) => v.appointment).slice(0, 4) ?? [];
  const firstName = user.name?.split(" ")[0];

  return (
    <div className="space-y-10">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-semibold text-navy">Welcome back{firstName ? `, ${firstName}` : ""}</h1>
        <p className="mt-1 text-sm text-muted">Here&apos;s an overview of your care.</p>
        <div className="mt-4">
          <QuickActions />
        </div>
      </div>

      <section aria-labelledby="next-heading">
        <h2 id="next-heading" className="sr-only">
          Next appointment
        </h2>
        {appointments.ok ? <NextAppointmentCard appointment={upcoming[0] ?? null} /> : <ErrorState message={appointments.message} />}
      </section>

      <div className="grid gap-10 xl:grid-cols-2">
        <section>
          <SectionHeading title="Upcoming appointments" href="/patient/appointments" />
          {appointments.ok ? (
            <AppointmentRows
              items={upcoming.slice(1, 5)}
              emptyTitle={upcoming.length === 0 ? "Nothing scheduled" : "No other upcoming visits"}
              emptyDescription="Appointments you book will appear here."
            />
          ) : (
            <ErrorState message={appointments.message} />
          )}
        </section>

        <section>
          <SectionHeading title="Previous appointments" href="/patient/appointments" />
          {appointments.ok ? (
            <AppointmentRows
              items={past}
              showNotes
              emptyTitle="No previous appointments"
              emptyDescription="Completed visits and your doctor's notes will show up here."
            />
          ) : (
            <ErrorState message={appointments.message} />
          )}
        </section>
      </div>

      <div className="grid gap-10 xl:grid-cols-2">
        <section>
          <SectionHeading title="AI conversations" href="/ai-assistant" linkLabel="Open assistant" />
          <AiConversationsSection result={conversations} />
        </section>

        <section>
          <SectionHeading title="Health documents" href="/patient/documents" linkLabel="Manage documents" />
          <DocumentsSection result={documents} />
        </section>
      </div>

      <section>
        <SectionHeading title="Notifications" href="/patient/notifications" />
        <NotificationsList limit={5} />
      </section>
    </div>
  );
}
