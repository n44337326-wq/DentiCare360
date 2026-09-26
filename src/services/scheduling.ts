import { db } from "@/database/client";
import { ACTIVE_STATUSES } from "@/lib/appointment-rules";
import {
  explainUnavailability,
  findNextAvailable,
  findNextAvailableDates,
  generateSlotsForDate,
  getAvailabilityCalendar,
  unavailableMessage,
  type BookedByDate,
  type NextAvailable,
  type UnavailableReason,
} from "@/lib/availability";
import { NotFoundError } from "@/lib/errors";
import { addDays, clinicNow, formatLongDate, formatTime12 } from "@/lib/time";
import type { DoctorScheduleInput } from "@/lib/validation";
import type { Doctor, TimeSlot } from "@/types";
import { audit } from "@/services/audit";
import { getDoctor } from "@/services/catalog";
import { doctorInclude, toDoctor } from "@/services/mappers";
import { notifyUser } from "@/services/notifications";

const SCAN_DAYS = 60;

/** Claimed slot start-times for the given doctors, grouped by doctor then date. */
export async function getBookedSlots(
  doctorIds: string[],
  fromDate: string,
  toDate: string
): Promise<Map<string, Map<string, Set<string>>>> {
  const rows = await db.appointmentSlot.findMany({
    where: { doctorId: { in: doctorIds }, date: { gte: fromDate, lte: toDate } },
    select: { doctorId: true, date: true, startTime: true },
  });
  const result = new Map<string, Map<string, Set<string>>>();
  for (const id of doctorIds) result.set(id, new Map());
  for (const r of rows) {
    const byDate = result.get(r.doctorId)!;
    if (!byDate.has(r.date)) byDate.set(r.date, new Set());
    byDate.get(r.date)!.add(r.startTime);
  }
  return result;
}

export interface DoctorSlotsResult {
  date: string;
  slots: TimeSlot[];
  /** Set when the doctor has nothing open on the requested date. */
  unavailable?: { reason: UnavailableReason; message: string };
  /** The next dates that do have an open slot (only present when `unavailable` is). */
  alternatives: NextAvailable[];
}

/** Slots for one doctor on one date, plus "next available" alternatives when the date is unavailable. */
export async function getDoctorSlots(doctor: Doctor, date: string): Promise<DoctorSlotsResult> {
  const now = clinicNow();
  const booked = await getBookedSlots([doctor.id], date < now.dateISO ? now.dateISO : date, addDays(date, SCAN_DAYS));
  const byDate: BookedByDate = booked.get(doctor.id)!;

  const slots = generateSlotsForDate(doctor, date, byDate.get(date), now);
  const reason = explainUnavailability(doctor, date, byDate.get(date), now);
  if (!reason) return { date, slots, alternatives: [] };

  return {
    date,
    slots,
    unavailable: { reason, message: unavailableMessage(doctor.name, date) },
    alternatives: findNextAvailableDates(doctor, byDate, now, { fromDate: date, count: 4, daysToScan: SCAN_DAYS }),
  };
}

export async function getDoctorCalendar(doctor: Doctor, days = 21) {
  const now = clinicNow();
  const booked = await getBookedSlots([doctor.id], now.dateISO, addDays(now.dateISO, days));
  const byDate = booked.get(doctor.id)!;
  return {
    dates: getAvailabilityCalendar(doctor, byDate, now, days),
    nextAvailable: findNextAvailable(doctor, byDate, now, { daysToScan: SCAN_DAYS }),
  };
}

/** Next open slot for each of many doctors using a single slots query (for doctor cards). */
export async function getNextAvailableForDoctors(doctors: Doctor[]): Promise<Map<string, NextAvailable | null>> {
  const now = clinicNow();
  const booked = await getBookedSlots(
    doctors.map((d) => d.id),
    now.dateISO,
    addDays(now.dateISO, SCAN_DAYS)
  );
  return new Map(
    doctors.map((d) => [d.id, findNextAvailable(d, booked.get(d.id) ?? new Map(), now, { daysToScan: SCAN_DAYS })])
  );
}

export interface ScheduleUpdateResult {
  doctor: Doctor;
  /** Active appointments that now fall on a newly blocked date or a now-unavailable doctor. */
  affectedAppointments: number;
}

/**
 * Applies a doctor's schedule changes (working days/hours, breaks, holidays and
 * leave, online/in-person support, temporary unavailability). Existing
 * appointments are never cancelled automatically: affected patients are
 * notified so they can reschedule, and the count is returned to the caller.
 */
export async function saveDoctorSchedule(
  doctorId: string,
  input: DoctorScheduleInput,
  actorUserId: string,
  ip?: string
): Promise<ScheduleUpdateResult> {
  const existing = await getDoctor(doctorId);
  if (!existing) throw new NotFoundError("Doctor not found.");

  const today = clinicNow().dateISO;
  const previouslyBlocked = new Set(existing.holidays);
  const nextBlocked = input.blockedDates?.map((b) => b.date) ?? existing.holidays;
  const newlyBlocked = nextBlocked.filter((d) => !previouslyBlocked.has(d) && d >= today);

  const becameUnavailable = input.isTemporarilyUnavailable === true && !existing.isTemporarilyUnavailable;
  const becameAvailable = input.isTemporarilyUnavailable === false && existing.isTemporarilyUnavailable;

  await db.$transaction(async (tx) => {
    await tx.doctor.update({
      where: { id: doctorId },
      data: {
        supportsOnline: input.supportsOnline,
        supportsInPerson: input.supportsInPerson,
        autoConfirm: input.autoConfirm,
        isTemporarilyUnavailable: input.isTemporarilyUnavailable,
        unavailableReason:
          input.isTemporarilyUnavailable === false ? null : (input.unavailableReason ?? undefined),
      },
    });

    if (input.availability) {
      await tx.doctorAvailability.deleteMany({ where: { doctorId } });
      await tx.doctorAvailability.createMany({
        data: input.availability.map((d) => ({
          doctorId,
          dayOfWeek: d.dayOfWeek,
          isActive: d.isActive,
          startTime: d.startTime,
          endTime: d.endTime,
          breakStart: d.breakStart || null,
          breakEnd: d.breakEnd || null,
        })),
      });
    }

    if (input.blockedDates) {
      await tx.doctorBlockedDate.deleteMany({ where: { doctorId } });
      await tx.doctorBlockedDate.createMany({
        data: input.blockedDates.map((b) => ({ doctorId, date: b.date, kind: b.kind, reason: b.reason ?? null })),
        skipDuplicates: true,
      });
    }
  });

  // Notify patients whose upcoming appointments are affected.
  const affectedWhere = {
    doctorId,
    status: { in: [...ACTIVE_STATUSES] },
    OR: [
      ...(newlyBlocked.length ? [{ date: { in: newlyBlocked } }] : []),
      ...(becameUnavailable ? [{ date: { gte: today } }] : []),
    ],
  };
  const hasAffectedFilter = newlyBlocked.length > 0 || becameUnavailable;
  const affected = hasAffectedFilter
    ? await db.appointment.findMany({ where: affectedWhere, include: { patient: { select: { userId: true } } } })
    : [];

  for (const appt of affected) {
    await notifyUser(
      appt.patient.userId,
      "DOCTOR_AVAILABILITY",
      "Your doctor's availability changed",
      `${existing.name} is no longer available on ${formatLongDate(appt.date)}. Please reschedule your appointment at ${formatTime12(appt.startTime)}.`
    );
  }

  if (becameAvailable) {
    const upcoming = await db.appointment.findMany({
      where: { doctorId, status: { in: [...ACTIVE_STATUSES] }, date: { gte: today } },
      include: { patient: { select: { userId: true } } },
    });
    const seen = new Set<string>();
    for (const appt of upcoming) {
      if (seen.has(appt.patient.userId)) continue;
      seen.add(appt.patient.userId);
      await notifyUser(
        appt.patient.userId,
        "DOCTOR_AVAILABILITY",
        "Doctor available again",
        `${existing.name} is available again. Your upcoming appointment stands.`
      );
    }
  }

  await audit({
    userId: actorUserId,
    action: "DOCTOR_SCHEDULE_UPDATED",
    entityType: "Doctor",
    entityId: doctorId,
    metadata: { fields: Object.keys(input), affectedAppointments: affected.length },
    ipAddress: ip,
  });

  const fresh = await db.doctor.findUniqueOrThrow({ where: { id: doctorId }, include: doctorInclude });
  return { doctor: toDoctor(fresh), affectedAppointments: affected.length };
}
