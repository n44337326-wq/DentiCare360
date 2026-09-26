import type { Doctor, Specialty } from "@/types";
import { ErrorState } from "@/components/shared/states";
import { AddDoctorDialog } from "@/components/admin/add-doctor-dialog";
import { DoctorsTable } from "@/components/admin/doctors-table";
import { PageHeader } from "@/components/doctor/page-header";
import { listDoctors, listSpecialties } from "@/services/catalog";
import { requireAdminUser } from "@/app/admin/_guard";

export const metadata = { title: "Doctors — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminDoctorsPage() {
  await requireAdminUser();

  let data: { doctors: Doctor[]; specialties: Specialty[] } | null = null;
  try {
    const [doctors, specialties] = await Promise.all([listDoctors({ includeInactive: true }), listSpecialties()]);
    data = { doctors, specialties };
  } catch (err) {
    console.error("[admin/doctors] failed to load", err);
  }

  return (
    <div>
      <PageHeader
        title="Doctors"
        description="Manage fees, availability and account status for every doctor, including inactive ones."
        actions={data && <AddDoctorDialog specialties={data.specialties} />}
      />
      {data ? (
        <DoctorsTable doctors={data.doctors} />
      ) : (
        <ErrorState message="We couldn't load the doctors. Please refresh the page to try again." />
      )}
    </div>
  );
}
