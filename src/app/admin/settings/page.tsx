import { CLINIC_TIMEZONE } from "@/lib/time";
import { formatBytes } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, InlineAlert } from "@/components/shared/states";
import { AuditLogTable } from "@/components/admin/audit-log-table";
import { PageHeader } from "@/components/doctor/page-header";
import { getAssistantProvider } from "@/services/ai";
import { getDatabaseStatus, listAuditLogs, type AuditLogEntry } from "@/services/admin";
import { getPaymentProvider } from "@/services/payments";
import { MAX_UPLOAD_BYTES } from "@/services/storage";
import { requireAdminUser } from "@/app/admin/_guard";

export const metadata = { title: "Settings — Admin" };
export const dynamic = "force-dynamic";

const RATE_LIMITS = [
  "Sign-in: 8 attempts per account and 30 per IP address, every 15 minutes",
  "Registration: 10 per IP address per hour",
  "Booking: 15 requests per user per minute",
  "Payments: 10 requests per user per minute",
  "AI assistant: 20 messages per minute and 300 per day, per user or IP address",
  "Document uploads: 20 per patient per hour",
  "Contact form: 5 messages per IP address per hour",
];

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
      <dt className="text-sm text-slate-600">{label}</dt>
      <dd className="text-sm font-medium text-navy">{children}</dd>
    </div>
  );
}

export default async function AdminSettingsPage() {
  const user = await requireAdminUser();

  const db = await getDatabaseStatus();
  let audit: AuditLogEntry[] | null = null;
  try {
    audit = await listAuditLogs(user, 50);
  } catch (err) {
    console.error("[admin/settings] failed to load audit log", err);
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Settings" description="A read-only view of how this system is configured. Values come from the server environment." />

      <InlineAlert variant="info" title="Demo environment">
        All people, appointments, payments and documents in this system are fictional demo data. The demo payment provider moves no money and
        the AI assistant is a rule-based demo, not a clinician.
      </InlineAlert>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">System</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-border">
              <Row label="Clinic timezone">{CLINIC_TIMEZONE}</Row>
              <Row label="Database">
                {db.ok ? (
                  <Badge variant="success">Connected{db.latencyMs !== undefined ? ` · ${db.latencyMs} ms` : ""}</Badge>
                ) : (
                  <Badge variant="destructive">Unreachable</Badge>
                )}
              </Row>
              <Row label="Payment provider">{getPaymentProvider().name}</Row>
              <Row label="AI provider">{getAssistantProvider().name}</Row>
              <Row label="Upload limit">{formatBytes(MAX_UPLOAD_BYTES)} per file (PDF, PNG, JPEG, WebP)</Row>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Rate limits</CardTitle>
            <p className="text-sm text-slate-600">Protect sign-in, booking and the AI assistant from abuse.</p>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-700">
              {RATE_LIMITS.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <section aria-labelledby="audit-heading">
        <h2 id="audit-heading" className="mb-1 text-lg font-semibold text-navy">Recent audit log</h2>
        <p className="mb-4 max-w-3xl text-sm text-slate-600">
          The audit log records who signed in (or failed to), who opened a patient record or AI conversation, and changes to appointments,
          schedules, services, doctors and payments. It stores the action, the record type and id, the user and IP address — never passwords,
          card details or the contents of records. Showing the 50 most recent entries.
        </p>
        {audit ? <AuditLogTable entries={audit} /> : <ErrorState message="We couldn't load the audit log. Please refresh the page to try again." />}
      </section>
    </div>
  );
}
