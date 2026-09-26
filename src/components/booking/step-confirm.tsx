import { CircleCheck, NotebookPen, Receipt } from "lucide-react";
import { InlineAlert } from "@/components/shared/states";
import { formatCurrency } from "@/lib/utils";
import { SummaryList } from "@/components/booking/booking-summary";
import type { BookingDerived, BookingState } from "@/components/booking/booking-state";

/** Review screen shown before the patient presses "Confirm booking". */
export function StepConfirm({
  state,
  derived,
  error,
  pending,
}: {
  state: BookingState;
  derived: BookingDerived;
  error: string | null;
  pending: boolean;
}) {
  const { doctor } = derived;
  return (
    <div className="space-y-5">
      {error && (
        <InlineAlert variant="error" title="We couldn't complete your booking">
          {error}
        </InlineAlert>
      )}

      <section aria-labelledby="review-heading" className="rounded-xl border border-border bg-white p-5">
        <h3 id="review-heading" className="mb-4 text-base font-semibold text-navy">
          Appointment details
        </h3>
        <SummaryList state={state} derived={derived} />
        <dl className="mt-3 border-t border-border pt-3">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-600">Patient</dt>
          <dd className="mt-1 text-sm font-medium text-navy">{derived.patientName}</dd>
        </dl>
        {state.notes.trim() && (
          <div className="mt-3 border-t border-border pt-3">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-600">
              <NotebookPen className="h-3.5 w-3.5" aria-hidden="true" />
              Notes for the doctor
            </p>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm text-navy">{state.notes.trim()}</p>
          </div>
        )}
      </section>

      <ul className="space-y-2 text-sm text-slate-700">
        <li className="flex gap-2">
          <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-green" aria-hidden="true" />
          {doctor?.autoConfirm
            ? "This doctor confirms bookings instantly — you'll see it confirmed right away."
            : "This doctor reviews bookings personally — you'll be notified as soon as your request is confirmed."}
        </li>
        <li className="flex gap-2">
          <Receipt className="mt-0.5 h-4 w-4 shrink-0 text-green" aria-hidden="true" />
          {doctor ? `The consultation fee is ${formatCurrency(doctor.consultationFee)}. Nothing is charged now — you can pay from your patient portal.` : ""}
        </li>
        {state.conversationId && (
          <li className="flex gap-2">
            <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-green" aria-hidden="true" />
            Your AI assistant chat summary (patient-reported symptoms, not a diagnosis) will be shared with the doctor.
          </li>
        )}
      </ul>
      {pending && (
        <p role="status" className="sr-only">
          Booking your appointment…
        </p>
      )}
    </div>
  );
}
