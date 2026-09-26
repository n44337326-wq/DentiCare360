import { redirect } from "next/navigation";
import { Receipt } from "lucide-react";
import { getSessionUser } from "@/lib/guards";
import { listPaymentsForPatient } from "@/services/payments";
import { formatCurrency } from "@/lib/utils";
import type { PaymentItem } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState, InlineAlert } from "@/components/shared/states";
import { loadSafe } from "@/components/patient/load-safe";
import { PageHeader } from "@/components/patient/page-header";
import { PaymentsTable } from "@/components/patient/payments-table";

export const metadata = { title: "Payments — DentiCare360" };
export const dynamic = "force-dynamic";

const sum = (items: PaymentItem[], status: PaymentItem["status"]) =>
  items.filter((p) => p.status === status).reduce((total, p) => total + p.amount, 0);

export default async function PatientPaymentsPage({ searchParams }: { searchParams: Promise<{ paid?: string }> }) {
  const user = await getSessionUser();
  if (!user || user.role !== "PATIENT" || !user.patientId) redirect("/login");
  const patientId = user.patientId;
  const { paid } = await searchParams;

  const result = await loadSafe("payments", () => listPaymentsForPatient(patientId));

  return (
    <div>
      <PageHeader title="Payments" description="Your consultation fees, payment status and invoices." />

      {paid === "1" && (
        <InlineAlert variant="success" title="Payment received" className="mb-4">
          Thank you. Your invoice is available below.
        </InlineAlert>
      )}

      {!result.ok ? (
        <ErrorState message={result.message} />
      ) : result.data.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No payments yet"
          description="Consultation fees appear here once you book an appointment."
        />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted">Total paid</p>
                <p className="mt-1 text-2xl font-semibold text-navy">{formatCurrency(sum(result.data, "PAID"))}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted">Amount due</p>
                <p className="mt-1 text-2xl font-semibold text-navy">{formatCurrency(sum(result.data, "PENDING"))}</p>
              </CardContent>
            </Card>
          </div>

          <PaymentsTable payments={result.data} />

          <p className="text-xs text-muted">
            Demo payments: no card details are collected or stored. A real payment provider plugs in server-side.
          </p>
        </div>
      )}
    </div>
  );
}
