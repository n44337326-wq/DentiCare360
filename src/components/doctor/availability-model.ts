import type { BlockedDate, BlockKind, Doctor } from "@/types";
import { doctorScheduleSchema } from "@/lib/validation";

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
/** Monday-first display order. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export const KIND_LABEL: Record<BlockKind, string> = {
  HOLIDAY: "Holiday",
  LEAVE: "Leave",
  BLOCKED: "Blocked",
};

export interface DayRow {
  dayOfWeek: number;
  isActive: boolean;
  startTime: string;
  endTime: string;
  hasBreak: boolean;
  breakStart: string;
  breakEnd: string;
}

export interface ScheduleState {
  days: DayRow[];
  blockedDates: BlockedDate[];
  supportsOnline: boolean;
  supportsInPerson: boolean;
  isTemporarilyUnavailable: boolean;
  unavailableReason: string;
  autoConfirm: boolean;
}

const DEFAULT_DAY = { startTime: "09:00", endTime: "17:00", breakStart: "13:00", breakEnd: "14:00" };

export function stateFromDoctor(doctor: Doctor): ScheduleState {
  const days = WEEK_ORDER.map((dayOfWeek): DayRow => {
    const found = doctor.availability.find((a) => a.dayOfWeek === dayOfWeek);
    if (!found) return { dayOfWeek, isActive: false, hasBreak: false, ...DEFAULT_DAY };
    return {
      dayOfWeek,
      isActive: found.isActive,
      startTime: found.startTime,
      endTime: found.endTime,
      hasBreak: !!(found.breakStart && found.breakEnd),
      breakStart: found.breakStart ?? DEFAULT_DAY.breakStart,
      breakEnd: found.breakEnd ?? DEFAULT_DAY.breakEnd,
    };
  });
  return {
    days,
    blockedDates: [...doctor.blockedDates].sort((a, b) => a.date.localeCompare(b.date)),
    supportsOnline: doctor.supportsOnline,
    supportsInPerson: doctor.supportsInPerson,
    isTemporarilyUnavailable: doctor.isTemporarilyUnavailable,
    unavailableReason: doctor.unavailableReason ?? "",
    autoConfirm: doctor.autoConfirm,
  };
}

/** Request body for PUT /api/doctors/:id/schedule (matches `doctorScheduleSchema`). Unset break fields are null. */
export function toPayload(s: ScheduleState) {
  return {
    availability: s.days.map((d) => ({
      dayOfWeek: d.dayOfWeek,
      isActive: d.isActive,
      startTime: d.startTime,
      endTime: d.endTime,
      breakStart: d.isActive && d.hasBreak ? d.breakStart : null,
      breakEnd: d.isActive && d.hasBreak ? d.breakEnd : null,
    })),
    blockedDates: s.blockedDates.map((b) => ({ date: b.date, kind: b.kind, ...(b.reason ? { reason: b.reason } : {}) })),
    supportsOnline: s.supportsOnline,
    supportsInPerson: s.supportsInPerson,
    isTemporarilyUnavailable: s.isTemporarilyUnavailable,
    unavailableReason: s.isTemporarilyUnavailable ? s.unavailableReason.trim() : "",
    autoConfirm: s.autoConfirm,
  };
}

export type ScheduleErrors = Record<string, string>;

/** Validates with the same zod schema the API uses. Errors are keyed `day.<dayOfWeek>.<field>` or a form-level key. */
export function validateSchedule(
  s: ScheduleState
): { ok: true; payload: ReturnType<typeof toPayload> } | { ok: false; errors: ScheduleErrors } {
  const payload = toPayload(s);
  const errors: ScheduleErrors = {};

  if (!s.supportsOnline && !s.supportsInPerson) {
    errors.consultation = "Keep at least one consultation type turned on.";
  }

  const result = doctorScheduleSchema.safeParse(payload);
  if (!result.success) {
    for (const issue of result.error.issues) {
      const [root, index, field] = issue.path;
      if (root === "availability" && typeof index === "number" && typeof field === "string") {
        const day = payload.availability[index]?.dayOfWeek;
        const key = `day.${day}.${field}`;
        errors[key] ??= issue.message;
      } else if (root === "blockedDates") {
        errors.blocked ??= issue.message;
      } else if (root === "unavailableReason") {
        errors.reason ??= issue.message;
      } else {
        errors.form ??= issue.message;
      }
    }
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, payload };
}
