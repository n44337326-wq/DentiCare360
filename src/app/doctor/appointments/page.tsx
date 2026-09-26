import { isActiveStatus } from "@/lib/appointment-rules";
import { clinicToday } from "@/lib/time";
import type { Appointment } from "@/types";
import { ErrorState } from "@/components/shared/states";
import { AppointmentsTabs } from "@/components/doctor/appointments-tabs";
import { PageHeader } from "@/components/doctor/page-header";
import { listAppointmentsForDoctor } from "@/services/appointments";
import { requireDoctorUser } from "@/app/doctor/_guard";

export const metadata = { title: "Appointments — Doctor Portal" };
export const dynamic = "force-dynamic";

const byTime = (a: Appointment, b: Appointment) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`);

export default async function DoctorAppointmentsPage() {
  const user = await requireDoctorUser();
  const today = clinicToday();

  let appointments: Appointment[] | null = null;
  try {
    appointments = await listAppointmentsForDoctor(user.doctorId);
  } catch (err) {
    console.error("[doctor/appointments] failed to load", err);
  }

  const buckets = appointments && {
    today: appointments.filter((a) => a.date === today && a.status !== "CANCELLED").sort(byTime),
    upcoming: appointments.filter((a) => a.date > today && isActiveStatus(a.status)).sort(byTime),
    requests: appointments.filter((a) => a.status === "PENDING" && a.date >= today).sort(byTime),
    past: appointments
      .filter((a) => a.date < today || (a.date > today && !isActiveStatus(a.status)) || (a.date === today && a.status === "CANCELLED"))
      .sort((a, b) => byTime(b, a)),
  };

  return (
    <div>
      <PageHeader
        title="Appointments"
        description="Accept requests, reschedule, record notes and complete visits. Patients are notified of every change."
      />
      {buckets ? (
        <AppointmentsTabs buckets={buckets} />
      ) : (
        <ErrorState message="We couldn't load your appointments. Please refresh the page to try again." />
      )}
    </div>
  );
}
