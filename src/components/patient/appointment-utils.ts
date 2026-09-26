import { allowedActions, isActiveStatus } from "@/lib/appointment-rules";
import { clinicNow, timeToMinutes, type ClinicNow } from "@/lib/time";
import type { Appointment } from "@/types";

/** Patient-facing actions an appointment card can offer (from the shared lifecycle rules). */
export type PatientAction = "reschedule" | "cancel";

export interface AppointmentView {
  appointment: Appointment;
  actions: PatientAction[];
}

export interface AppointmentGroups {
  upcoming: AppointmentView[];
  past: AppointmentView[];
  cancelled: AppointmentView[];
}

const JOIN_OPENS_MINUTES_BEFORE = 15;

/** Whole minutes from `now` until the given clinic date + time (negative once passed). */
export function minutesUntil(date: string, time: string, now: ClinicNow): number {
  const dayDiff = (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${now.dateISO}T00:00:00Z`)) / 86_400_000;
  return dayDiff * 1440 + timeToMinutes(time) - now.minutes;
}

export function hasEnded(a: Pick<Appointment, "date" | "endTime">, now: ClinicNow = clinicNow()): boolean {
  return minutesUntil(a.date, a.endTime, now) <= 0;
}

export type JoinWindow = { state: "before"; minutesUntilOpen: number } | { state: "open" } | { state: "ended" };

/** Online consultations can be joined from 15 minutes before the start until the end time. */
export function joinWindow(a: Pick<Appointment, "date" | "startTime" | "endTime">, now: ClinicNow): JoinWindow {
  if (minutesUntil(a.date, a.endTime, now) <= 0) return { state: "ended" };
  const untilStart = minutesUntil(a.date, a.startTime, now);
  if (untilStart > JOIN_OPENS_MINUTES_BEFORE) return { state: "before", minutesUntilOpen: untilStart - JOIN_OPENS_MINUTES_BEFORE };
  return { state: "open" };
}

export function canJoinOnline(a: Appointment): boolean {
  return a.consultationType === "ONLINE" && isActiveStatus(a.status);
}

export function toView(appointment: Appointment, now: ClinicNow): AppointmentView {
  const actions = allowedActions(appointment, "PATIENT", now).filter(
    (x): x is PatientAction => x === "reschedule" || x === "cancel"
  );
  return { appointment, actions };
}

/**
 * Splits a patient's appointments into the three tabs. Upcoming = still active
 * and not yet finished (an in-progress visit stays here so it can be joined).
 */
export function groupAppointments(appointments: Appointment[], now: ClinicNow = clinicNow()): AppointmentGroups {
  const key = (a: Appointment) => `${a.date} ${a.startTime}`;
  const upcoming: Appointment[] = [];
  const past: Appointment[] = [];
  const cancelled: Appointment[] = [];

  for (const a of appointments) {
    if (a.status === "CANCELLED") cancelled.push(a);
    else if (isActiveStatus(a.status) && !hasEnded(a, now)) upcoming.push(a);
    else past.push(a);
  }

  upcoming.sort((x, y) => key(x).localeCompare(key(y)));
  past.sort((x, y) => key(y).localeCompare(key(x)));
  cancelled.sort((x, y) => key(y).localeCompare(key(x)));

  const view = (a: Appointment) => toView(a, now);
  return { upcoming: upcoming.map(view), past: past.map(view), cancelled: cancelled.map(view) };
}
