import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/guards";
import { listDocumentsForPatient } from "@/services/documents";
import { ErrorState } from "@/components/shared/states";
import { DocumentList } from "@/components/patient/document-list";
import { DocumentUpload } from "@/components/patient/document-upload";
import { formatInstantDate, loadSafe } from "@/components/patient/load-safe";
import { PageHeader } from "@/components/patient/page-header";

export const metadata = { title: "Health documents — DentiCare360" };
export const dynamic = "force-dynamic";

export default async function PatientDocumentsPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "PATIENT" || !user.patientId) redirect("/login");
  const patientId = user.patientId;

  const result = await loadSafe("documents", () => listDocumentsForPatient(patientId));

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Health documents"
        description="Upload reports, prescriptions and dental records. Files are stored privately and only visible to you and your treating clinicians."
      />
      <div className="space-y-8">
        <DocumentUpload />
        <section>
          <h2 className="mb-3 text-lg font-semibold text-navy">Your documents</h2>
          {result.ok ? (
            <DocumentList documents={result.data.map((d) => ({ ...d, uploadedLabel: formatInstantDate(d.uploadedAt) }))} />
          ) : (
            <ErrorState message={result.message} />
          )}
        </section>
      </div>
    </div>
  );
}
