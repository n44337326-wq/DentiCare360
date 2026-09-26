import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarPlus } from "lucide-react";
import { getSessionUser } from "@/lib/guards";
import { listAppointmentsForPatient } from "@/services/appointments";
import { listPaymentsForPatient } from "@/services/payments";
import type { PaymentStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/states";
import { AppointmentList } from "@/components/patient/appointment-list";
import { groupAppointments } from "@/components/patient/appointment-utils";
import { loadSafe } from "@/components/patient/load-safe";
import { PageHeader } from "@/components/patient/page-header";

export const metadata = { title: "My appointments — DentiCare360" };
export const dynamic = "force-dynamic";

export default async function PatientAppointmentsPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "PATIENT" || !user.patientId) redirect("/login");
  const patientId = user.patientId;

  const [appointments, payments] = await Promise.all([
    loadSafe("appointments", () => listAppointmentsForPatient(patientId)),
    // Payment status is a nice-to-have on the cards; never block the page on it.
    loadSafe("payments", () => listPaymentsForPatient(patientId)),
  ]);

  const paymentByAppointment: Record<string, PaymentStatus> = {};
  if (payments.ok) for (const p of payments.data) paymentByAppointment[p.appointmentId] = p.status;

  return (
    <div>
      <PageHeader
        title="My appointments"
        description="Review upcoming visits, reschedule or cancel, and join online consultations."
        actions={
          <Button asChild>
            <Link href="/appointments/book">
              <CalendarPlus aria-hidden="true" /> Book appointment
            </Link>
          </Button>
        }
      />
      {appointments.ok ? (
        <AppointmentList groups={groupAppointments(appointments.data)} payments={paymentByAppointment} />
      ) : (
        <ErrorState message={appointments.message} />
      )}
    </div>
  );
}
