import { describe, expect, it } from "vitest";
import { allowedActions, canPerform, isActiveStatus } from "@/lib/appointment-rules";
import type { AppointmentStatus } from "@/types";

const NOW = { dateISO: "2026-09-21", minutes: 10 * 60 }; // Mon 10:00

const appt = (status: AppointmentStatus, date = "2026-09-25", startTime = "10:00") => ({ status, date, startTime });

describe("role permissions on the appointment lifecycle", () => {
  it("lets a patient cancel or reschedule an upcoming active appointment — and nothing else", () => {
    for (const status of ["PENDING", "CONFIRMED", "RESCHEDULED"] as const) {
      expect(allowedActions(appt(status), "PATIENT", NOW).sort()).toEqual(["cancel", "reschedule"]);
    }
  });

  it("stops a patient changing appointments that are finished or already started", () => {
    for (const status of ["COMPLETED", "CANCELLED", "NO_SHOW"] as const) {
      expect(allowedActions(appt(status), "PATIENT", NOW)).toEqual([]);
    }
    expect(allowedActions(appt("CONFIRMED", "2026-09-20"), "PATIENT", NOW)).toEqual([]); // yesterday
    expect(allowedActions(appt("CONFIRMED", "2026-09-21", "09:00"), "PATIENT", NOW)).toEqual([]); // started earlier today
  });

  it("never lets a patient accept, complete, mark no-show or write clinical notes", () => {
    for (const action of ["accept", "complete", "no_show", "note"] as const) {
      expect(canPerform(action, appt("CONFIRMED"), "PATIENT", NOW)).toBe(false);
      expect(canPerform(action, appt("PENDING"), "PATIENT", NOW)).toBe(false);
    }
  });

  it("lets a doctor accept only a pending request", () => {
    expect(canPerform("accept", appt("PENDING"), "DOCTOR", NOW)).toBe(true);
    expect(canPerform("accept", appt("CONFIRMED"), "DOCTOR", NOW)).toBe(false);
    expect(canPerform("accept", appt("CANCELLED"), "DOCTOR", NOW)).toBe(false);
  });

  it("lets a doctor complete / mark no-show only once the visit day has arrived", () => {
    expect(canPerform("complete", appt("CONFIRMED", "2026-09-25"), "DOCTOR", NOW)).toBe(false); // future
    expect(canPerform("complete", appt("CONFIRMED", "2026-09-21", "15:00"), "DOCTOR", NOW)).toBe(true); // today
    expect(canPerform("complete", appt("RESCHEDULED", "2026-09-18"), "DOCTOR", NOW)).toBe(true); // past
    expect(canPerform("no_show", appt("CONFIRMED", "2026-09-18"), "DOCTOR", NOW)).toBe(true);
    expect(canPerform("complete", appt("PENDING", "2026-09-18"), "DOCTOR", NOW)).toBe(false); // never accepted
    expect(canPerform("complete", appt("COMPLETED", "2026-09-18"), "DOCTOR", NOW)).toBe(false); // already done
  });

  it("lets a doctor reschedule, cancel and add notes on active appointments; notes stay possible after completion", () => {
    expect(allowedActions(appt("CONFIRMED"), "DOCTOR", NOW)).toEqual(expect.arrayContaining(["reschedule", "cancel", "note"]));
    expect(canPerform("note", appt("COMPLETED", "2026-09-10"), "DOCTOR", NOW)).toBe(true);
    expect(canPerform("note", appt("CANCELLED"), "DOCTOR", NOW)).toBe(false);
    expect(canPerform("reschedule", appt("COMPLETED", "2026-09-10"), "DOCTOR", NOW)).toBe(false);
  });

  it("gives an admin the doctor's powers", () => {
    expect(allowedActions(appt("PENDING"), "ADMIN", NOW)).toEqual(expect.arrayContaining(["accept", "reschedule", "cancel"]));
  });

  it("classifies which statuses still hold a calendar slot", () => {
    expect(["PENDING", "CONFIRMED", "RESCHEDULED"].every((s) => isActiveStatus(s as AppointmentStatus))).toBe(true);
    expect(["COMPLETED", "CANCELLED", "NO_SHOW"].some((s) => isActiveStatus(s as AppointmentStatus))).toBe(false);
  });
});
