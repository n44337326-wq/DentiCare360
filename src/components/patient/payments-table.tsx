import Link from "next/link";
import { FileText } from "lucide-react";
import { formatShortDate } from "@/lib/time";
import { formatCurrency } from "@/lib/utils";
import type { PaymentItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PaymentStatusBadge } from "@/components/shared/status-badge";
import { PayNowButton } from "@/components/patient/pay-now-button";

function Action({ p }: { p: PaymentItem }) {
  const label = `${p.serviceName ?? "consultation"} ${formatCurrency(p.amount, p.currency)}`;
  if (p.status === "PENDING") return <PayNowButton paymentId={p.id} label={label} />;
  if (p.status === "PAID") {
    return (
      <Button size="sm" variant="outline" asChild>
        <Link href={`/patient/payments/${p.id}/invoice`}>
          <FileText aria-hidden="true" /> View invoice<span className="sr-only"> for {label}</span>
        </Link>
      </Button>
    );
  }
  return <span className="text-xs text-muted">—</span>;
}

const apptDate = (p: PaymentItem) => (p.appointmentDate ? formatShortDate(p.appointmentDate) : "—");

/** Table on md+ screens, stacked cards below. */
export function PaymentsTable({ payments }: { payments: PaymentItem[] }) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-border bg-white shadow-sm md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <caption className="sr-only">Payment history</caption>
          <thead className="bg-soft-blue/60 text-xs uppercase tracking-wide text-navy">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Service</th>
              <th scope="col" className="px-4 py-3 font-semibold">Doctor</th>
              <th scope="col" className="px-4 py-3 font-semibold">Appointment</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Amount</th>
              <th scope="col" className="px-4 py-3 font-semibold">Status</th>
              <th scope="col" className="px-4 py-3 font-semibold">Invoice</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold"><span className="sr-only">Action</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {payments.map((p) => (
              <tr key={p.id} className="align-middle">
                <td className="px-4 py-3 font-medium text-navy">{p.serviceName ?? "Consultation"}</td>
                <td className="px-4 py-3 text-navy">{p.doctorName ?? "—"}</td>
                <td className="px-4 py-3 text-navy">{apptDate(p)}</td>
                <td className="px-4 py-3 text-right font-medium text-navy">{formatCurrency(p.amount, p.currency)}</td>
                <td className="px-4 py-3"><PaymentStatusBadge status={p.status} /></td>
                <td className="px-4 py-3 text-navy">{p.invoiceNumber ?? "—"}</td>
                <td className="px-4 py-3 text-right"><Action p={p} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden">
        {payments.map((p) => (
          <li key={p.id}>
            <Card>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-navy">{p.serviceName ?? "Consultation"}</p>
                    <p className="text-sm text-muted">
                      {p.doctorName ?? "—"} · {apptDate(p)}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold text-navy">{formatCurrency(p.amount, p.currency)}</p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <PaymentStatusBadge status={p.status} />
                    {p.invoiceNumber && <span className="text-xs text-muted">{p.invoiceNumber}</span>}
                  </div>
                  <Action p={p} />
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
