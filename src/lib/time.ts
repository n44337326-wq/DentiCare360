/**
 * Clinic-time helpers. Dates travel through the app as "YYYY-MM-DD" strings and
 * times as "HH:mm" strings in the clinic's timezone, so none of this depends on
 * the server's or browser's local timezone.
 */

// NEXT_PUBLIC_ so browser code (slot pickers) and the server always agree on the clinic's "today".
export const CLINIC_TIMEZONE = process.env.NEXT_PUBLIC_CLINIC_TIMEZONE ?? process.env.CLINIC_TIMEZONE ?? "America/New_York";

export interface ClinicNow {
  dateISO: string;
  /** Minutes since local midnight in the clinic timezone. */
  minutes: number;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidISODate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function isValidTime(value: string): boolean {
  return TIME.test(value);
}

/** Current date and time-of-day in the clinic's timezone. */
export function clinicNow(now: Date = new Date(), timeZone: string = CLINIC_TIMEZONE): ClinicNow {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return {
    dateISO: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

export function clinicToday(now: Date = new Date()): string {
  return clinicNow(now).dateISO;
}

/** Pure calendar arithmetic on ISO date strings (UTC-based, so DST-proof). */
export function addDays(dateISO: string, days: number): string {
  const d = new Date(`${dateISO}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 0 = Sunday … 6 = Saturday */
export function dayOfWeek(dateISO: string): number {
  return new Date(`${dateISO}T00:00:00Z`).getUTCDay();
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60).toString().padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/** True when an appointment that starts at the given clinic date/time is already in the past. */
export function hasStarted(dateISO: string, startTime: string, now: ClinicNow = clinicNow()): boolean {
  if (dateISO !== now.dateISO) return dateISO < now.dateISO;
  return timeToMinutes(startTime) <= now.minutes;
}

export function formatLongDate(dateISO: string): string {
  return new Date(`${dateISO}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatShortDate(dateISO: string): string {
  return new Date(`${dateISO}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** "13:30" → "1:30 PM" */
export function formatTime12(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${suffix}`;
}
