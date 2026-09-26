import { AlertTriangle, ExternalLink, FileText, HeartPulse, Mail, Phone, UserRound } from "lucide-react";
import type { Appointment, MedicalDocumentItem } from "@/types";
import { formatBytes, formatDate } from "@/lib/utils";
import { formatTime12 } from "@/lib/time";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/states";
import { AppointmentStatusBadge } from "@/components/shared/status-badge";
import { AiSummaryPanel } from "@/components/doctor/ai-summary-panel";

const CATEGORY_LABEL: Record<string, string> = {
  report: "Report",
  prescription: "Prescription",
  dental_record: "Dental record",
  other: "Other",
};

export function ContactCard({ name, email, phone }: { name: string; email: string; phone?: string | null }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <UserRound className="h-5 w-5 text-cyan" aria-hidden="true" /> Contact
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="font-medium text-navy">{name}</p>
        <p className="flex items-center gap-2 break-all text-slate-700">
          <Mail className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
          <a href={`mailto:${email}`} className="hover:underline">{email}</a>
        </p>
        <p className="flex items-center gap-2 text-slate-700">
          <Phone className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
          {phone ? <a href={`tel:${phone}`} className="hover:underline">{phone}</a> : "No phone on file"}
        </p>
      </CardContent>
    </Card>
  );
}

function Tags({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) return <p className="text-sm text-slate-600">{empty}</p>;
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li key={item}>
          <Badge variant="default">{item}</Badge>
        </li>
      ))}
    </ul>
  );
}

export function MedicalProfileCard({
  profile,
}: {
  profile: {
    allergies: string[];
    currentMedications: string[];
    medicalHistory: string | null;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
  } | null;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <HeartPulse className="h-5 w-5 text-cyan" aria-hidden="true" /> Medical profile
        </CardTitle>
        <p className="text-sm text-slate-600">Entered by the patient — not verified by the clinic.</p>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {!profile ? (
          <p className="text-slate-600">The patient has not completed a medical profile yet.</p>
        ) : (
          <>
            <div>
              <h3 className="mb-1.5 flex items-center gap-1.5 font-semibold text-navy">
                <AlertTriangle className="h-4 w-4 text-amber-700" aria-hidden="true" /> Allergies
              </h3>
              <Tags items={profile.allergies} empty="None reported." />
            </div>
            <div>
              <h3 className="mb-1.5 font-semibold text-navy">Current medications</h3>
              <Tags items={profile.currentMedications} empty="None reported." />
            </div>
            <div>
              <h3 className="mb-1.5 font-semibold text-navy">Medical history</h3>
              <p className="whitespace-pre-line text-slate-700">{profile.medicalHistory || "Nothing entered."}</p>
            </div>
            <div>
              <h3 className="mb-1.5 font-semibold text-navy">Emergency contact</h3>
              <p className="text-slate-700">
                {profile.emergencyContactName || profile.emergencyContactPhone
                  ? `${profile.emergencyContactName ?? ""}${profile.emergencyContactPhone ? ` · ${profile.emergencyContactPhone}` : ""}`
                  : "Nothing entered."}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function VisitHistory({ appointments }: { appointments: Appointment[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Appointments with you</CardTitle>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <EmptyState title="No appointments yet" />
        ) : (
          <ol className="space-y-4">
            {appointments.map((a) => (
              <li key={a.id} className="space-y-2 border-l-2 border-cyan/40 pl-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-navy">
                    {formatDate(a.date)}, {formatTime12(a.startTime)} · {a.serviceName}
                  </p>
                  <AppointmentStatusBadge status={a.status} />
                </div>
                {a.notes && (
                  <p className="text-sm text-slate-700">
                    <span className="font-medium text-navy">Patient notes: </span>
                    {a.notes}
                  </p>
                )}
                {a.doctorNotes && (
                  <p className="whitespace-pre-line rounded-lg bg-soft-blue px-3 py-2 text-sm text-navy">
                    <span className="font-semibold">Your notes: </span>
                    {a.doctorNotes}
                  </p>
                )}
                {a.aiSummary && <AiSummaryPanel summary={a.aiSummary} />}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

export function DocumentsCard({ documents }: { documents: MedicalDocumentItem[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-5 w-5 text-cyan" aria-hidden="true" /> Documents
        </CardTitle>
        <p className="text-sm text-slate-600">Uploaded by the patient. Opening a document is access-controlled.</p>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <EmptyState title="No documents uploaded" />
        ) : (
          <ul className="divide-y divide-border">
            {documents.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-navy">{d.fileName}</p>
                  <p className="text-xs text-slate-600">
                    {CATEGORY_LABEL[d.category] ?? d.category} · {formatBytes(d.sizeBytes)} · uploaded{" "}
                    {formatDate(d.uploadedAt.slice(0, 10))}
                  </p>
                </div>
                <a
                  href={`/api/documents/${d.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-cyan underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
                >
                  View<span className="sr-only"> {d.fileName}</span> <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
