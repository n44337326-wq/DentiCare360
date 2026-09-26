import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState, ErrorState, InlineAlert } from "@/components/shared/states";
import { PageHeader } from "@/components/doctor/page-header";
import {
  ContactCard,
  DocumentsCard,
  MedicalProfileCard,
  VisitHistory,
} from "@/components/doctor/patient-sections";
import { listAppointmentsForDoctor } from "@/services/appointments";
import { getPatientRecordForDoctor } from "@/services/users";
import { toDocument } from "@/services/mappers";
import { requireDoctorUser } from "@/app/doctor/_guard";

export const metadata = { title: "Patient — Doctor Portal" };
export const dynamic = "force-dynamic";

type Outcome =
  | { kind: "ok"; record: Awaited<ReturnType<typeof getPatientRecordForDoctor>> }
  | { kind: "forbidden" }
  | { kind: "missing" }
  | { kind: "error" };

async function load(user: Awaited<ReturnType<typeof requireDoctorUser>>, patientId: string): Promise<Outcome> {
  try {
    return { kind: "ok", record: await getPatientRecordForDoctor(user, patientId) };
  } catch (err) {
    if (err instanceof ForbiddenError) return { kind: "forbidden" };
    if (err instanceof NotFoundError) return { kind: "missing" };
    console.error("[doctor/patients] failed to load record", err);
    return { kind: "error" };
  }
}

const BackLink = () => (
  <Link href="/doctor/appointments" className={buttonVariants({ variant: "ghost", size: "sm", className: "mb-4 -ml-3" })}>
    <ArrowLeft aria-hidden="true" /> Back to appointments
  </Link>
);

export default async function DoctorPatientPage({ params }: { params: Promise<{ patientId: string }> }) {
  const user = await requireDoctorUser();
  const { patientId } = await params;
  const outcome = await load(user, patientId);

  if (outcome.kind === "missing") notFound();

  if (outcome.kind === "forbidden") {
    return (
      <div>
        <BackLink />
        <EmptyState
          icon={ShieldAlert}
          title="You can't open this patient record"
          description="You can only view patients who have an appointment with you. If you think this is a mistake, contact the clinic administrator."
          action={
            <Link href="/doctor/appointments" className={buttonVariants({ variant: "outline" })}>
              Go to my appointments
            </Link>
          }
        />
      </div>
    );
  }

  if (outcome.kind === "error") {
    return (
      <div>
        <BackLink />
        <ErrorState message="We couldn't load this patient record. Please refresh the page to try again." />
      </div>
    );
  }

  const { record } = outcome;
  let history: Awaited<ReturnType<typeof listAppointmentsForDoctor>> = [];
  let historyFailed = false;
  try {
    history = (await listAppointmentsForDoctor(user.doctorId)).filter((a) => a.patientId === patientId);
  } catch {
    historyFailed = true;
  }
  const ordered = [...history].sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`));

  return (
    <div>
      <BackLink />
      <PageHeader
        title={record.user.name}
        description="Patient record. Opening this page is recorded in the audit log because it contains protected health information."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="space-y-6">
          <ContactCard name={record.user.name} email={record.user.email} phone={record.user.phone} />
          <MedicalProfileCard profile={record.medicalProfile} />
          <DocumentsCard documents={record.documents.map(toDocument)} />
        </div>
        <div className="space-y-6">
          {historyFailed ? (
            <InlineAlert variant="error">We couldn&apos;t load the appointment history. Please refresh the page.</InlineAlert>
          ) : (
            <VisitHistory appointments={ordered} />
          )}
        </div>
      </div>
    </div>
  );
}
