import type { Appointment } from "@/types";
import { ErrorState } from "@/components/shared/states";
import { AdminAppointments } from "@/components/admin/admin-appointments";
import { PageHeader } from "@/components/doctor/page-header";
import { listAllAppointments } from "@/services/appointments";
import { requireAdminUser } from "@/app/admin/_guard";

export const metadata = { title: "Appointments — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminAppointmentsPage() {
  await requireAdminUser();

  let appointments: Appointment[] | null = null;
  try {
    appointments = await listAllAppointments();
  } catch (err) {
    console.error("[admin/appointments] failed to load", err);
  }

  return (
    <div>
      <PageHeader
        title="Appointments"
        description="Every appointment across the clinic (most recent 500). Admins can accept, reschedule, cancel and complete on a doctor's behalf; patients are notified."
      />
      {appointments ? (
        <AdminAppointments appointments={appointments} />
      ) : (
        <ErrorState message="We couldn't load the appointments. Please refresh the page to try again." />
      )}
    </div>
  );
}
