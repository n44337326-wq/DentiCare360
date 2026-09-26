import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSessionUser } from "@/lib/guards";
import { getPaymentForViewer } from "@/services/payments";
import { formatLongDate, formatTime12 } from "@/lib/time";
import { formatCurrency } from "@/lib/utils";
import { PaymentStatusBadge } from "@/components/shared/status-badge";
import { formatInstantDate } from "@/components/patient/load-safe";
import { PrintButton } from "@/components/patient/print-button";

export const metadata = { title: "Invoice — DentiCare360" };
export const dynamic = "force-dynamic";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 font-medium text-navy">{children}</dd>
    </div>
  );
}

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user || user.role !== "PATIENT") redirect("/login");
  const { id } = await params;

  const payment = await getPaymentForViewer(user, id).catch(() => null);
  if (!payment || !payment.invoice) notFound();

  const { appointment, invoice } = payment;
  const amount = formatCurrency(Number(payment.amount), payment.currency);

  return (
    <div className="mx-auto max-w-3xl">
      {/* The site header and footer live in the root layout, so hide them when printing. */}
      <style>{"@media print { header, footer { display: none !important; } body { background: #fff !important; } }"}</style>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/patient/payments"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to payments
        </Link>
        <PrintButton />
      </div>

      <article
        aria-labelledby="invoice-title"
        className="relative overflow-hidden rounded-xl border border-border bg-white p-6 shadow-sm sm:p-10 print:rounded-none print:border-0 print:p-0 print:shadow-none"
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="-rotate-12 select-none text-6xl font-bold uppercase tracking-widest text-navy/5 sm:text-8xl">Demo invoice</span>
        </div>

        <div className="relative space-y-8">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
            <div>
              <p className="text-xl font-semibold text-navy">DentiCare360</p>
              <address className="mt-1 text-sm not-italic text-muted">
                120 Harbor Lane, Suite 4<br />
                Riverside, NY 10001<br />
                billing@denticare360.example
              </address>
            </div>
            <div className="text-right">
              <h1 id="invoice-title" className="text-2xl font-semibold text-navy">Invoice</h1>
              <p className="mt-1 text-sm text-navy">{invoice.invoiceNumber}</p>
              <p className="text-sm text-muted">Issued {formatInstantDate(invoice.issuedAt)}</p>
            </div>
          </div>

          <dl className="grid gap-5 sm:grid-cols-2">
            <Field label="Billed to">
              {payment.patient.user.name}
              <span className="block text-sm font-normal text-muted">{payment.patient.user.email}</span>
            </Field>
            <Field label="Status">
              <PaymentStatusBadge status={payment.status} />
            </Field>
            <Field label="Doctor">{appointment.doctor.user.name}</Field>
            <Field label="Service">{appointment.service.name}</Field>
            <Field label="Appointment date">
              {formatLongDate(appointment.date)}
              <span className="block text-sm font-normal text-muted">{formatTime12(appointment.startTime)}</span>
            </Field>
            <Field label="Payment method">Demo payment (no card on file)</Field>
          </dl>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-y border-border bg-soft-blue/60 text-xs uppercase tracking-wide text-navy">
                <tr>
                  <th scope="col" className="px-3 py-2 font-semibold">Description</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="px-3 py-3 text-navy">{appointment.service.name} consultation with {appointment.doctor.user.name}</td>
                  <td className="px-3 py-3 text-right text-navy">{amount}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" className="px-3 py-3 text-right font-semibold text-navy">Total</th>
                  <td className="px-3 py-3 text-right text-lg font-semibold text-navy">{amount}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <p className="border-t border-border pt-4 text-xs text-muted">
            Demo invoice: generated for demonstration purposes only. It is not a tax document and no money was moved.
            All names and addresses are fictional.
          </p>
        </div>
      </article>
    </div>
  );
}
