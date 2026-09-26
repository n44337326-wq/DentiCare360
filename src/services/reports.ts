import { db } from "@/database/client";
import { ACTIVE_STATUSES } from "@/lib/appointment-rules";
import { addDays, clinicToday } from "@/lib/time";
import type { AppointmentStatus, UrgencyLevel } from "@/types";

export interface OverviewStats {
  activeDoctors: number;
  patients: number;
  appointmentsToday: number;
  upcomingAppointments: number;
  completedAppointments: number;
  revenuePaid: number;
  revenuePending: number;
  aiConversations: number;
  aiEmergencyFlags: number;
}

export async function getOverviewStats(): Promise<OverviewStats> {
  const today = clinicToday();
  const [activeDoctors, patients, appointmentsToday, upcoming, completed, paid, pending, aiConversations, aiEmergencyFlags] =
    await Promise.all([
      db.doctor.count({ where: { isActive: true } }),
      db.patient.count(),
      db.appointment.count({ where: { date: today, status: { in: [...ACTIVE_STATUSES] } } }),
      db.appointment.count({ where: { date: { gte: today }, status: { in: [...ACTIVE_STATUSES] } } }),
      db.appointment.count({ where: { status: "COMPLETED" } }),
      db.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
      db.payment.aggregate({ where: { status: "PENDING" }, _sum: { amount: true } }),
      db.aiConversation.count(),
      db.aiConversation.count({ where: { urgency: { in: ["HIGH", "EMERGENCY"] } } }),
    ]);
  return {
    activeDoctors,
    patients,
    appointmentsToday,
    upcomingAppointments: upcoming,
    completedAppointments: completed,
    revenuePaid: Number(paid._sum.amount ?? 0),
    revenuePending: Number(pending._sum.amount ?? 0),
    aiConversations,
    aiEmergencyFlags,
  };
}

export interface Reports {
  byStatus: { status: AppointmentStatus; count: number }[];
  bySpecialty: { name: string; count: number }[];
  byDoctor: { name: string; count: number; revenue: number }[];
  aiUrgency: { urgency: UrgencyLevel; count: number }[];
  next14Days: { date: string; count: number }[];
}

export async function getReports(): Promise<Reports> {
  const today = clinicToday();
  const [statusGroups, appts, aiGroups, upcoming, paidPayments] = await Promise.all([
    db.appointment.groupBy({ by: ["status"], _count: { _all: true } }),
    db.appointment.findMany({ select: { doctor: { select: { specialty: { select: { name: true } }, user: { select: { name: true } } } } } }),
    db.aiConversation.groupBy({ by: ["urgency"], _count: { _all: true } }),
    db.appointment.findMany({
      where: { date: { gte: today, lte: addDays(today, 13) }, status: { in: [...ACTIVE_STATUSES] } },
      select: { date: true },
    }),
    db.payment.findMany({
      where: { status: "PAID" },
      select: { amount: true, appointment: { select: { doctor: { select: { user: { select: { name: true } } } } } } },
    }),
  ]);

  const tally = <T,>(items: T[], key: (item: T) => string) => {
    const map = new Map<string, number>();
    for (const i of items) map.set(key(i), (map.get(key(i)) ?? 0) + 1);
    return map;
  };

  const specialtyCounts = tally(appts, (a) => a.doctor.specialty.name);
  const doctorCounts = tally(appts, (a) => a.doctor.user.name);
  const revenueByDoctor = new Map<string, number>();
  for (const p of paidPayments) {
    const name = p.appointment.doctor.user.name;
    revenueByDoctor.set(name, (revenueByDoctor.get(name) ?? 0) + Number(p.amount));
  }
  const dayCounts = tally(upcoming, (a) => a.date);

  return {
    byStatus: statusGroups.map((g) => ({ status: g.status, count: g._count._all })),
    bySpecialty: [...specialtyCounts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    byDoctor: [...doctorCounts]
      .map(([name, count]) => ({ name, count, revenue: revenueByDoctor.get(name) ?? 0 }))
      .sort((a, b) => b.count - a.count),
    aiUrgency: aiGroups.map((g) => ({ urgency: g.urgency, count: g._count._all })),
    next14Days: Array.from({ length: 14 }, (_, i) => {
      const date = addDays(today, i);
      return { date, count: dayCounts.get(date) ?? 0 };
    }),
  };
}
