import type { PatientSummary } from "@/types";
import { ErrorState } from "@/components/shared/states";
import { PatientsDirectory } from "@/components/admin/patients-directory";
import { PageHeader } from "@/components/doctor/page-header";
import { listPatients } from "@/services/users";
import { requireAdminUser } from "@/app/admin/_guard";

export const metadata = { title: "Patients — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminPatientsPage() {
  await requireAdminUser();

  let patients: PatientSummary[] | null = null;
  try {
    patients = await listPatients();
  } catch (err) {
    console.error("[admin/patients] failed to load", err);
  }

  return (
    <div>
      <PageHeader
        title="Patients"
        description="A directory of registered patients. For privacy, medical records are visible only to the treating doctor."
      />
      {patients ? (
        <PatientsDirectory patients={patients} />
      ) : (
        <ErrorState message="We couldn't load the patients. Please refresh the page to try again." />
      )}
    </div>
  );
}
