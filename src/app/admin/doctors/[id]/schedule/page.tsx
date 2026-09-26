import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { Doctor } from "@/types";
import { buttonVariants } from "@/components/ui/button";
import { ErrorState, InlineAlert } from "@/components/shared/states";
import { AvailabilityEditor } from "@/components/doctor/availability-editor";
import { PageHeader } from "@/components/doctor/page-header";
import { getDoctor } from "@/services/catalog";
import { requireAdminUser } from "@/app/admin/_guard";

export const metadata = { title: "Doctor schedule — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminDoctorSchedulePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminUser();
  const { id } = await params;

  let doctor: Doctor | null = null;
  let failed = false;
  try {
    doctor = await getDoctor(id);
  } catch (err) {
    console.error("[admin/doctors/schedule] failed to load", err);
    failed = true;
  }
  if (!failed && !doctor) notFound();

  return (
    <div>
      <Link href="/admin/doctors" className={buttonVariants({ variant: "ghost", size: "sm", className: "mb-4 -ml-3" })}>
        <ArrowLeft aria-hidden="true" /> Back to doctors
      </Link>
      {failed || !doctor ? (
        <ErrorState message="We couldn't load this doctor's schedule. Please refresh the page to try again." />
      ) : (
        <>
          <PageHeader title={`${doctor.name} — schedule`} description={`${doctor.specialtyName}. Changes apply immediately to what patients can book.`} />
          {!doctor.isActive && (
            <InlineAlert variant="warning" className="mb-6">
              This doctor is inactive and is hidden from patients.
            </InlineAlert>
          )}
          <AvailabilityEditor doctorId={doctor.id} initialDoctor={doctor} appointmentsHref="/admin/appointments" />
        </>
      )}
    </div>
  );
}
