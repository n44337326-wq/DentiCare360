import Link from "next/link";
import type { Doctor } from "@/types";
import { formatLongDate, formatShortDate, formatTime12 } from "@/lib/time";
import { EmptyState } from "@/components/shared/states";
import { CalendarX } from "lucide-react";

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Working days, hours and breaks in plain language. */
export function WeeklyAvailability({ availability }: { availability: Doctor["availability"] }) {
  const byDay = new Map(availability.map((a) => [a.dayOfWeek, a]));
  return (
    <dl className="divide-y divide-border text-sm">
      {WEEK_ORDER.map((dow) => {
        const day = byDay.get(dow);
        const working = !!day?.isActive;
        return (
          <div key={dow} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2.5">
            <dt className="font-medium text-navy">{DAY_NAMES[dow]}</dt>
            <dd className="text-right text-navy/80">
              {working && day ? (
                <>
                  {formatTime12(day.startTime)} &ndash; {formatTime12(day.endTime)}
                  {day.breakStart && day.breakEnd && (
                    <span className="block text-xs text-navy/65">
                      Break {formatTime12(day.breakStart)} &ndash; {formatTime12(day.breakEnd)}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-navy/65">Not working</span>
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

export interface UpcomingDay {
  date: string;
  times: string[]; // "HH:mm"
}

/** The next few days that still have open slots; every time chip deep-links into booking. */
export function UpcomingSlots({ doctorId, days }: { doctorId: string; days: UpcomingDay[] }) {
  if (days.length === 0) {
    return (
      <EmptyState
        icon={CalendarX}
        title="No open slots right now"
        description="This doctor has no open appointments in the coming weeks. Please check back soon or choose another doctor."
      />
    );
  }
  return (
    <ul className="flex flex-col gap-5">
      {days.map((day) => (
        <li key={day.date}>
          <h3 className="text-sm font-semibold text-navy">
            <time dateTime={day.date}>{formatLongDate(day.date)}</time>
          </h3>
          <ul className="mt-2 flex flex-wrap gap-2" aria-label={`Open times on ${formatShortDate(day.date)}`}>
            {day.times.map((time) => (
              <li key={time}>
                <Link
                  href={`/appointments/book?doctor=${doctorId}&date=${day.date}&time=${time}`}
                  className="inline-flex h-9 items-center rounded-lg border border-border bg-white px-3 text-sm text-navy transition-colors hover:border-cyan hover:bg-cyan-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
                >
                  {formatTime12(time)}
                </Link>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
