"use client";

import { useCallback, useState } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { addDays, clinicToday, formatLongDate, formatTime12 } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { TimeSlot } from "@/types";
import { ErrorState, InlineAlert, SkeletonRows } from "@/components/shared/states";

export interface SlotSelection {
  date: string;
  startTime: string;
}

interface CalendarResponse {
  dates: { date: string; hasAvailability: boolean }[];
  nextAvailable: { date: string; slot: TimeSlot } | null;
}

interface DaySlotsResponse {
  date: string;
  slots: TimeSlot[];
  unavailable?: { reason: string; message: string };
  alternatives: { date: string; slot: TimeSlot }[];
}

const dayLabel = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  return {
    weekday: d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
    day: d.getUTCDate(),
    month: d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
  };
};

/** Horizontally scrollable strip of the next three weeks. Days with no room are dimmed but still selectable, so the patient sees WHY. */
export function DateStrip({
  doctorId,
  value,
  onChange,
}: {
  doctorId: string;
  value: string | null;
  onChange: (date: string) => void;
}) {
  const { data: calendar, error, retry } = useFetch<CalendarResponse>(`/api/availability?doctorId=${encodeURIComponent(doctorId)}`);

  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (!calendar) return <SkeletonRows rows={1} />;

  return (
    <div>
      <div role="group" aria-label="Choose a date" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 scrollbar-hide">
        {calendar.dates.map(({ date, hasAvailability }) => {
          const { weekday, day, month } = dayLabel(date);
          const selected = value === date;
          return (
            <button
              key={date}
              type="button"
              aria-pressed={selected}
              aria-label={`${formatLongDate(date)}${hasAvailability ? "" : " — no availability"}`}
              onClick={() => onChange(date)}
              className={cn(
                "flex w-16 shrink-0 flex-col items-center rounded-xl border px-2 py-2.5 text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan",
                selected ? "border-navy bg-navy text-white shadow-md" : "border-border bg-white text-navy hover:-translate-y-0.5 hover:border-cyan hover:shadow-sm",
                !hasAvailability && !selected && "opacity-50"
              )}
            >
              <span className="text-xs font-medium opacity-80">{weekday}</span>
              <span className="text-lg font-semibold leading-tight">{day}</span>
              <span className="text-[11px] opacity-80">{month}</span>
              <span
                className={cn("mt-1 h-1.5 w-1.5 rounded-full", hasAvailability ? (selected ? "bg-cyan" : "bg-green") : "bg-transparent")}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
      {calendar.nextAvailable && (
        <p className="mt-1 text-xs text-muted">
          Next available: {formatLongDate(calendar.nextAvailable.date)}, {formatTime12(calendar.nextAvailable.slot.startTime)}
        </p>
      )}
    </div>
  );
}

/**
 * Open time slots for one doctor on one date. When the doctor is unavailable it
 * explains why ("Dr. X is unavailable on …") and offers the next dates that DO
 * have room; picking one selects that date and time in a single click.
 */
export function TimeSlots({
  doctorId,
  date,
  value,
  onChange,
}: {
  doctorId: string;
  date: string;
  value: string | null;
  onChange: (selection: SlotSelection) => void;
}) {
  const { data, error, retry } = useFetch<DaySlotsResponse>(`/api/availability?doctorId=${encodeURIComponent(doctorId)}&date=${date}`);

  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (!data) return <SkeletonRows rows={2} />;

  const open = data.slots.filter((s) => !s.isBooked);

  if (data.unavailable || open.length === 0) {
    return (
      <div className="animate-fade-in space-y-3">
        <InlineAlert variant="warning" title={data.unavailable?.message ?? `No appointments are open on ${formatLongDate(date)}.`}>
          {data.alternatives.length > 0 ? "Here are the next available appointments:" : "There are no upcoming openings. Please check back soon or choose another doctor."}
        </InlineAlert>
        {data.alternatives.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-navy">Next available appointment:</p>
            <ul className="flex flex-wrap gap-2">
              {data.alternatives.map((alt) => (
                <li key={`${alt.date}-${alt.slot.startTime}`}>
                  <button
                    type="button"
                    onClick={() => onChange({ date: alt.date, startTime: alt.slot.startTime })}
                    className="rounded-lg border border-cyan/40 bg-cyan-light px-3 py-2 text-sm font-medium text-navy transition-all hover:-translate-y-0.5 hover:border-cyan hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
                  >
                    {new Date(`${alt.date}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" })}, {formatTime12(alt.slot.startTime)}
                    <span className="ml-1 text-xs text-muted">
                      ({new Date(`${alt.date}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })})
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div role="radiogroup" aria-label={`Available times on ${formatLongDate(date)}`} className="animate-fade-in grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
      {data.slots.map((slot) => {
        const selected = value === slot.startTime;
        return (
          <button
            key={slot.startTime}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={slot.isBooked}
            onClick={() => onChange({ date, startTime: slot.startTime })}
            className={cn(
              "rounded-lg border px-2 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan",
              selected
                ? "border-navy bg-navy text-white shadow-md"
                : "border-border bg-white text-navy hover:-translate-y-0.5 hover:border-cyan hover:shadow-sm",
              slot.isBooked && "cursor-not-allowed bg-slate-50 text-slate-400 line-through hover:translate-y-0 hover:border-border hover:shadow-none"
            )}
          >
            {formatTime12(slot.startTime)}
            {slot.isBooked && <span className="sr-only"> (booked)</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Date strip + time slots for one doctor: what the reschedule dialogs use. */
export function SlotPicker({
  doctorId,
  value,
  onChange,
}: {
  doctorId: string;
  value: SlotSelection | null;
  onChange: (selection: SlotSelection | null) => void;
}) {
  // Until the patient picks a day, start on the doctor's next day with room (falling back to tomorrow),
  // so the dialog never opens on a day the doctor doesn't work.
  const [picked, setPicked] = useState<string | null>(value?.date ?? null);
  const { data: calendar } = useFetch<CalendarResponse>(`/api/availability?doctorId=${encodeURIComponent(doctorId)}`);
  const date = picked ?? calendar?.nextAvailable?.date ?? addDays(clinicToday(), 1);

  const pickAlternative = useCallback(
    (sel: SlotSelection) => {
      setPicked(sel.date);
      onChange(sel);
    },
    [onChange]
  );

  return (
    <div className="space-y-4">
      <DateStrip
        doctorId={doctorId}
        value={date}
        onChange={(d) => {
          setPicked(d);
          onChange(null);
        }}
      />
      <TimeSlots
        doctorId={doctorId}
        date={date}
        value={value?.date === date ? value.startTime : null}
        onChange={pickAlternative}
      />
      {value && (
        <p className="text-sm text-navy" role="status">
          Selected: <strong>{formatLongDate(value.date)}</strong> at <strong>{formatTime12(value.startTime)}</strong>
        </p>
      )}
    </div>
  );
}
