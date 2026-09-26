import { CheckCircle2, Clock, Undo2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { PaymentItem, PaymentStatus } from "@/types";
import { ErrorState } from "@/components/shared/states";
import { PaymentsTable } from "@/components/admin/payments-table";
import { PageHeader } from "@/components/doctor/page-header";
import { StatCard } from "@/components/doctor/stat-card";
import { listAllPayments } from "@/services/payments";
import { requireAdminUser } from "@/app/admin/_guard";

export const metadata = { title: "Payments — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  await requireAdminUser();

  let payments: PaymentItem[] | null = null;
  try {
    payments = await listAllPayments();
  } catch (err) {
    console.error("[admin/payments] failed to load", err);
  }

  const total = (status: PaymentStatus) =>
    (payments ?? []).filter((p) => p.status === status).reduce((sum, p) => sum + p.amount, 0);

  return (
    <div>
      <PageHeader title="Payments" description="Read-only view of the most recent 500 payments and invoices." />
      {payments ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard icon={CheckCircle2} label="Paid" value={formatCurrency(total("PAID"))} tone="green" />
            <StatCard icon={Clock} label="Pending" value={formatCurrency(total("PENDING"))} tone="amber" />
            <StatCard icon={Undo2} label="Refunded" value={formatCurrency(total("REFUNDED"))} tone="navy" />
          </div>
          <PaymentsTable payments={payments} />
        </div>
      ) : (
        <ErrorState message="We couldn't load the payments. Please refresh the page to try again." />
      )}
    </div>
  );
}
