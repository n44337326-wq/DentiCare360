import { isActiveStatus } from "@/lib/appointment-rules";
import { addDays } from "@/lib/time";
import type { Appointment } from "@/types";

const byTime = (a: Appointment, b: Appointment) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`);

export interface DoctorDashboardData {
  today: Appointment[];
  upcoming: Appointment[];
  requests: Appointment[];
  patientCount: number;
  followUps: Appointment[];
}

/** Derives everything the doctor dashboard shows from one appointment list (all dates are clinic-calendar strings). */
export function buildDoctorDashboard(appointments: Appointment[], today: string): DoctorDashboardData {
  const weekEnd = addDays(today, 7);
  const active = appointments.filter((a) => isActiveStatus(a.status));

  // Patients who still have an active appointment today or later need no follow-up prompt.
  const hasNext = new Set(active.filter((a) => a.date >= today).map((a) => a.patientId));
  const cutoff = addDays(today, -60);
  const lastVisitByPatient = new Map<string, Appointment>();
  for (const a of appointments) {
    if (a.status !== "COMPLETED" || a.date < cutoff || a.date > today || hasNext.has(a.patientId)) continue;
    const prev = lastVisitByPatient.get(a.patientId);
    if (!prev || byTime(prev, a) < 0) lastVisitByPatient.set(a.patientId, a);
  }

  return {
    today: appointments.filter((a) => a.date === today && a.status !== "CANCELLED").sort(byTime),
    upcoming: active.filter((a) => a.date > today && a.date <= weekEnd).sort(byTime),
    requests: appointments.filter((a) => a.status === "PENDING" && a.date >= today).sort(byTime),
    patientCount: new Set(appointments.map((a) => a.patientId)).size,
    followUps: [...lastVisitByPatient.values()].sort((a, b) => byTime(b, a)),
  };
}
