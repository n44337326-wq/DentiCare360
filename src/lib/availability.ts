import type { Doctor, TimeSlot } from "@/types";
import {
  addDays,
  clinicNow,
  dayOfWeek,
  formatLongDate,
  minutesToTime,
  timeToMinutes,
  type ClinicNow,
} from "@/lib/time";

export const SLOT_MINUTES = 30;

/** Start times ("HH:mm") already claimed, keyed by "YYYY-MM-DD". */
export type BookedByDate = ReadonlyMap<string, ReadonlySet<string>>;

export type UnavailableReason =
  | "TEMPORARILY_UNAVAILABLE"
  | "BLOCKED_DATE"
  | "NOT_WORKING_DAY"
  | "PAST_DATE"
  | "FULLY_BOOKED";

/** The subset of a doctor the availability engine needs. */
export type ScheduleDoctor = Pick<Doctor, "isTemporarilyUnavailable" | "availability" | "holidays">;

/**
 * Generates the bookable slots for one doctor on one calendar date, applying
 * working hours, breaks, holidays/leave, temporary unavailability and the slots
 * already claimed by other appointments.
 *
 * This is the single source of truth the booking flow, the AI assistant and the
 * doctor cards all read from. A slot that is claimed is returned with
 * `isBooked: true`; callers that offer slots to patients must filter on it, and
 * the booking service re-validates against this same function inside the
 * transaction that claims the slot.
 */
export function generateSlotsForDate(
  doctor: ScheduleDoctor,
  dateISO: string,
  booked: ReadonlySet<string> = new Set(),
  now: ClinicNow = clinicNow()
): TimeSlot[] {
  if (dateISO < now.dateISO) return [];
  if (doctor.isTemporarilyUnavailable) return [];
  if (doctor.holidays.includes(dateISO)) return [];

  const day = doctor.availability.find((a) => a.dayOfWeek === dayOfWeek(dateISO) && a.isActive);
  if (!day) return [];

  const startMin = timeToMinutes(day.startTime);
  const endMin = timeToMinutes(day.endTime);
  const breakStart = day.breakStart ? timeToMinutes(day.breakStart) : null;
  const breakEnd = day.breakEnd ? timeToMinutes(day.breakEnd) : null;
  const isToday = dateISO === now.dateISO;

  const slots: TimeSlot[] = [];
  for (let t = startMin; t + SLOT_MINUTES <= endMin; t += SLOT_MINUTES) {
    const slotEnd = t + SLOT_MINUTES;
    // Skip any slot that overlaps the break window.
    if (breakStart !== null && breakEnd !== null && t < breakEnd && slotEnd > breakStart) continue;
    if (isToday && t <= now.minutes) continue;

    const startTime = minutesToTime(t);
    slots.push({
      date: dateISO,
      startTime,
      endTime: minutesToTime(slotEnd),
      isBooked: booked.has(startTime),
    });
  }
  return slots;
}

/** The single open slot matching a start time, or null if it is not offerable. */
export function findOpenSlot(
  doctor: ScheduleDoctor,
  dateISO: string,
  startTime: string,
  booked: ReadonlySet<string>,
  now: ClinicNow = clinicNow()
): TimeSlot | null {
  const slot = generateSlotsForDate(doctor, dateISO, booked, now).find((s) => s.startTime === startTime);
  return slot && !slot.isBooked ? slot : null;
}

export interface NextAvailable {
  date: string;
  slot: TimeSlot;
}

/**
 * Scans forward day by day for the doctor's next open slot, starting on
 * `fromDate` (inclusive). Used for "Next available" on doctor cards and to
 * propose alternatives when the chosen date is unavailable.
 */
export function findNextAvailable(
  doctor: ScheduleDoctor,
  bookedByDate: BookedByDate,
  now: ClinicNow = clinicNow(),
  options: { fromDate?: string; daysToScan?: number } = {}
): NextAvailable | null {
  const from = options.fromDate && options.fromDate > now.dateISO ? options.fromDate : now.dateISO;
  const days = options.daysToScan ?? 60;
  for (let i = 0; i < days; i++) {
    const dateISO = addDays(from, i);
    const open = generateSlotsForDate(doctor, dateISO, bookedByDate.get(dateISO), now).find((s) => !s.isBooked);
    if (open) return { date: dateISO, slot: open };
  }
  return null;
}

/** The next few dates (from `fromDate`) that still have at least one open slot. */
export function findNextAvailableDates(
  doctor: ScheduleDoctor,
  bookedByDate: BookedByDate,
  now: ClinicNow = clinicNow(),
  options: { fromDate?: string; count?: number; daysToScan?: number } = {}
): NextAvailable[] {
  const from = options.fromDate && options.fromDate > now.dateISO ? options.fromDate : now.dateISO;
  const wanted = options.count ?? 3;
  const days = options.daysToScan ?? 60;
  const results: NextAvailable[] = [];
  for (let i = 0; i < days && results.length < wanted; i++) {
    const dateISO = addDays(from, i);
    const open = generateSlotsForDate(doctor, dateISO, bookedByDate.get(dateISO), now).find((s) => !s.isBooked);
    if (open) results.push({ date: dateISO, slot: open });
  }
  return results;
}

export function getAvailabilityCalendar(
  doctor: ScheduleDoctor,
  bookedByDate: BookedByDate,
  now: ClinicNow = clinicNow(),
  daysToScan = 21
): { date: string; hasAvailability: boolean }[] {
  return Array.from({ length: daysToScan }, (_, i) => {
    const date = addDays(now.dateISO, i);
    const slots = generateSlotsForDate(doctor, date, bookedByDate.get(date), now);
    return { date, hasAvailability: slots.some((s) => !s.isBooked) };
  });
}

/** Why a doctor has nothing open on a date — drives the "Dr. X is unavailable on …" message. */
export function explainUnavailability(
  doctor: ScheduleDoctor,
  dateISO: string,
  booked: ReadonlySet<string> = new Set(),
  now: ClinicNow = clinicNow()
): UnavailableReason | null {
  if (dateISO < now.dateISO) return "PAST_DATE";
  if (doctor.isTemporarilyUnavailable) return "TEMPORARILY_UNAVAILABLE";
  if (doctor.holidays.includes(dateISO)) return "BLOCKED_DATE";
  if (!doctor.availability.some((a) => a.dayOfWeek === dayOfWeek(dateISO) && a.isActive)) return "NOT_WORKING_DAY";
  const slots = generateSlotsForDate(doctor, dateISO, booked, now);
  if (!slots.some((s) => !s.isBooked)) return "FULLY_BOOKED";
  return null;
}

export function unavailableMessage(doctorName: string, dateISO: string): string {
  return `${doctorName} is unavailable on ${formatLongDate(dateISO)}.`;
}
