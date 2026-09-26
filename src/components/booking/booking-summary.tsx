import { CalendarDays, Clock, Stethoscope, UserRound, Video, Building2 } from "lucide-react";
import { DoctorAvatar } from "@/components/shared/doctor-avatar";
import { formatLongDate, formatShortDate, formatTime12 } from "@/lib/time";
import { formatCurrency } from "@/lib/utils";
import type { BookingDerived, BookingState } from "@/components/booking/booking-state";

const NOT_SET = <span className="text-slate-500">Not selected yet</span>;

export const visitTypeLabel = (type: BookingState["consultationType"]) =>
  type === "ONLINE" ? "Online video consultation" : type === "IN_PERSON" ? "In person" : null;

/** Read-only booking summary rows. Used in the desktop sidebar and on the details / review steps. */
export function SummaryList({ state, derived }: { state: BookingState; derived: BookingDerived }) {
  const { service, doctor } = derived;
  const rows: { label: string; value: React.ReactNode }[] = [
    {
      label: "Service",
      value: service ? (
        <>
          {service.name}
          <span className="block text-xs text-slate-600">
            {service.durationMinutes} min · from {formatCurrency(service.startingPrice)}
          </span>
        </>
      ) : (
        NOT_SET
      ),
    },
    { label: "Specialty", value: derived.specialtyName ?? NOT_SET },
    {
      label: "Doctor",
      value: doctor ? (
        <span className="flex items-center gap-2">
          <DoctorAvatar name={doctor.name} photoUrl={doctor.photoUrl} size="sm" />
          <span>{doctor.name}</span>
        </span>
      ) : (
        NOT_SET
      ),
    },
    {
      label: "Date & time",
      value:
        state.date && state.startTime ? (
          <>
            {formatLongDate(state.date)}
            <span className="block text-xs text-slate-600">{formatTime12(state.startTime)}</span>
          </>
        ) : state.date ? (
          <>
            {formatLongDate(state.date)}
            <span className="block text-xs text-slate-600">Time not chosen yet</span>
          </>
        ) : (
          NOT_SET
        ),
    },
    { label: "Visit type", value: visitTypeLabel(state.consultationType) ?? NOT_SET },
    { label: "Consultation fee", value: doctor ? formatCurrency(doctor.consultationFee) : NOT_SET },
  ];
  return (
    <dl className="divide-y divide-border">
      {rows.map((row) => (
        <div key={row.label} className="py-3 first:pt-0 last:pb-0">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-600">{row.label}</dt>
          <dd className="mt-1 text-sm font-medium text-navy">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Desktop sidebar card. */
export function SummaryPanel({ state, derived }: { state: BookingState; derived: BookingDerived }) {
  return (
    <aside aria-label="Your booking so far" className="hidden lg:block">
      <div className="sticky top-24 rounded-xl border border-border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-navy">Your booking</h2>
        <SummaryList state={state} derived={derived} />
      </div>
    </aside>
  );
}

/** Compact chip row for small screens. */
export function SummaryChips({ state, derived }: { state: BookingState; derived: BookingDerived }) {
  const { service, doctor } = derived;
  const chips: { key: string; icon: React.ReactNode; text: string }[] = [];
  if (service) chips.push({ key: "service", icon: <Stethoscope className="h-3.5 w-3.5" />, text: service.name });
  if (doctor) chips.push({ key: "doctor", icon: <UserRound className="h-3.5 w-3.5" />, text: doctor.name });
  if (state.date) {
    chips.push({
      key: "when",
      icon: state.startTime ? <Clock className="h-3.5 w-3.5" /> : <CalendarDays className="h-3.5 w-3.5" />,
      text: `${formatShortDate(state.date)}${state.startTime ? `, ${formatTime12(state.startTime)}` : ""}`,
    });
  }
  if (state.consultationType) {
    chips.push({
      key: "type",
      icon: state.consultationType === "ONLINE" ? <Video className="h-3.5 w-3.5" /> : <Building2 className="h-3.5 w-3.5" />,
      text: state.consultationType === "ONLINE" ? "Online" : "In person",
    });
  }
  if (chips.length === 0) return null;
  return (
    <ul aria-label="Your selections so far" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide lg:hidden">
      {chips.map((chip) => (
        <li
          key={chip.key}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-soft-blue px-3 py-1.5 text-xs font-medium text-navy"
        >
          {chip.icon}
          <span className="max-w-[10rem] truncate">{chip.text}</span>
        </li>
      ))}
    </ul>
  );
}
