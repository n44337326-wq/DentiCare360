"use client";

import { useMemo, useState } from "react";
import { CreditCard } from "lucide-react";
import type { PaymentItem, PaymentStatus } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/states";
import { PaymentStatusBadge } from "@/components/shared/status-badge";

const ALL = "all";
const STATUSES: { value: PaymentStatus; label: string }[] = [
  { value: "PAID", label: "Paid" },
  { value: "PENDING", label: "Payment due" },
  { value: "REFUNDED", label: "Refunded" },
  { value: "FAILED", label: "Failed" },
  { value: "CANCELLED", label: "Void" },
];

/** Read-only payments list with a status filter. Table on wider screens, cards on phones. */
export function PaymentsTable({ payments }: { payments: PaymentItem[] }) {
  const [status, setStatus] = useState(ALL);
  const shown = useMemo(() => (status === ALL ? payments : payments.filter((p) => p.status === status)), [payments, status]);

  if (payments.length === 0) {
    return <EmptyState icon={CreditCard} title="No payments yet" description="Payments appear here when patients book appointments." />;
  }

  return (
    <div className="space-y-4">
      <div className="max-w-xs space-y-1.5">
        <Label htmlFor="pay-status">Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger id="pay-status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All payments</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <p className="text-sm text-slate-600" aria-live="polite">{shown.length} payment{shown.length === 1 ? "" : "s"}</p>

      {shown.length === 0 ? (
        <EmptyState title="No payments with this status" description="Choose a different status to see other payments." />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-border bg-white md:block">
            <table className="w-full min-w-[48rem] text-left text-sm">
              <caption className="sr-only">Payments</caption>
              <thead className="bg-soft-blue text-xs uppercase tracking-wide text-slate-700">
                <tr>
                  <th scope="col" className="px-4 py-3">Invoice</th>
                  <th scope="col" className="px-4 py-3">Patient</th>
                  <th scope="col" className="px-4 py-3">Service</th>
                  <th scope="col" className="px-4 py-3">Visit</th>
                  <th scope="col" className="px-4 py-3 text-right">Amount</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {shown.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{p.invoiceNumber ?? "—"}</td>
                    <td className="px-4 py-3 font-medium text-navy">{p.patientName ?? "—"}</td>
                    <td className="px-4 py-3">
                      <p className="text-slate-800">{p.serviceName ?? "—"}</p>
                      {p.doctorName && <p className="text-xs text-slate-600">{p.doctorName}</p>}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{p.appointmentDate ? formatDate(p.appointmentDate) : "—"}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums text-navy">{formatCurrency(p.amount, p.currency)}</td>
                    <td className="px-4 py-3"><PaymentStatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {shown.map((p) => (
              <li key={p.id}>
                <Card>
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-navy">{p.patientName ?? "—"}</p>
                        <p className="text-sm text-slate-600">{p.serviceName ?? "—"}{p.doctorName ? ` · ${p.doctorName}` : ""}</p>
                      </div>
                      <PaymentStatusBadge status={p.status} />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">{p.appointmentDate ? formatDate(p.appointmentDate) : "—"}</span>
                      <span className="font-semibold tabular-nums text-navy">{formatCurrency(p.amount, p.currency)}</span>
                    </div>
                    <p className="font-mono text-xs text-slate-600">{p.invoiceNumber ?? "No invoice yet"}</p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
