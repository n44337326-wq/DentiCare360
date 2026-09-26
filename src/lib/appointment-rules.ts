import type { AppointmentStatus, Role } from "@/types";
import { clinicNow, hasStarted, type ClinicNow } from "@/lib/time";

/** Statuses in which an appointment still holds a slot in the doctor's calendar. */
export const ACTIVE_STATUSES: readonly AppointmentStatus[] = ["PENDING", "CONFIRMED", "RESCHEDULED"];

export function isActiveStatus(status: AppointmentStatus): boolean {
  return ACTIVE_STATUSES.includes(status);
}

export type AppointmentActionName = "cancel" | "reschedule" | "accept" | "complete" | "no_show" | "note";

interface Subject {
  status: AppointmentStatus;
  date: string;
  startTime: string;
}

/**
 * The single source of truth for which lifecycle actions are permitted, used by
 * the API (to enforce) and by the UI (to decide which buttons to show):
 *
 *  - patients may cancel / reschedule their own upcoming, active appointments;
 *  - doctors may accept, reschedule, cancel, complete, mark no-show and add notes
 *    on their own appointments (completion only once the visit date has arrived);
 *  - admins may do anything a doctor or patient may.
 *
 * Callers are responsible for having verified that the actor actually owns the
 * appointment (patient/doctor) — this function only encodes the state machine.
 */
export function allowedActions(
  subject: Subject,
  role: Role,
  now: ClinicNow = clinicNow()
): AppointmentActionName[] {
  const actions: AppointmentActionName[] = [];
  const active = isActiveStatus(subject.status);
  const started = hasStarted(subject.date, subject.startTime, now);
  const visitDay = subject.date <= now.dateISO;

  if (role === "PATIENT") {
    if (active && !started) actions.push("reschedule", "cancel");
    return actions;
  }

  // DOCTOR or ADMIN
  if (subject.status === "PENDING") actions.push("accept");
  if (active) actions.push("reschedule", "cancel");
  if ((subject.status === "CONFIRMED" || subject.status === "RESCHEDULED") && visitDay) {
    actions.push("complete", "no_show");
  }
  if (subject.status !== "CANCELLED") actions.push("note");
  return actions;
}

export function canPerform(
  action: AppointmentActionName,
  subject: Subject,
  role: Role,
  now: ClinicNow = clinicNow()
): boolean {
  return allowedActions(subject, role, now).includes(action);
}
