import { EmptyState, ErrorState } from "@/components/shared/states";
import { AvailabilityEditor } from "@/components/doctor/availability-editor";
import { PageHeader } from "@/components/doctor/page-header";
import { getDoctor } from "@/services/catalog";
import { requireDoctorUser } from "@/app/doctor/_guard";
import type { Doctor } from "@/types";

export const metadata = { title: "Availability — Doctor Portal" };
export const dynamic = "force-dynamic";

export default async function DoctorAvailabilityPage() {
  const user = await requireDoctorUser();

  let doctor: Doctor | null = null;
  let failed = false;
  try {
    doctor = await getDoctor(user.doctorId);
  } catch (err) {
    console.error("[doctor/availability] failed to load", err);
    failed = true;
  }

  return (
    <div>
      <PageHeader
        title="Availability"
        description="Set your working days and hours, breaks, time off and how bookings arrive. The booking engine never offers a slot outside what you set here."
      />
      {failed ? (
        <ErrorState message="We couldn't load your schedule. Please refresh the page to try again." />
      ) : !doctor ? (
        <EmptyState title="Doctor profile not found" description="Your account is not linked to a doctor profile. Contact the clinic administrator." />
      ) : (
        <AvailabilityEditor doctorId={doctor.id} initialDoctor={doctor} />
      )}
    </div>
  );
}
