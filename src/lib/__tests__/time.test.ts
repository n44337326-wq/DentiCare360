import { describe, expect, it } from "vitest";
import { addDays, clinicNow, dayOfWeek, formatTime12, hasStarted, isValidISODate, isValidTime, minutesToTime, timeToMinutes } from "@/lib/time";

describe("clinic time helpers", () => {
  it("computes clinic-local date and time regardless of the machine timezone", () => {
    // 03:30 UTC on the 20th is 23:30 on the 19th in New York (EDT, UTC-4).
    expect(clinicNow(new Date("2026-09-20T03:30:00Z"), "America/New_York")).toEqual({ dateISO: "2026-09-19", minutes: 23 * 60 + 30 });
    expect(clinicNow(new Date("2026-09-20T03:30:00Z"), "Asia/Kolkata")).toEqual({ dateISO: "2026-09-20", minutes: 9 * 60 });
  });

  it("does the calendar maths without timezone drift", () => {
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2026-11-01", 1)).toBe("2026-11-02"); // across a US DST change
    expect(dayOfWeek("2026-09-21")).toBe(1);
  });

  it("validates dates and times strictly", () => {
    expect(isValidISODate("2026-09-21")).toBe(true);
    expect(isValidISODate("2026-02-30")).toBe(false);
    expect(isValidISODate("2026-9-21")).toBe(false);
    expect(isValidISODate("not-a-date")).toBe(false);
    expect(isValidTime("09:30")).toBe(true);
    expect(isValidTime("24:00")).toBe(false);
    expect(isValidTime("9:30")).toBe(false);
    expect(isValidTime("09:60")).toBe(false);
  });

  it("converts and formats times", () => {
    expect(timeToMinutes("13:30")).toBe(810);
    expect(minutesToTime(810)).toBe("13:30");
    expect(formatTime12("00:00")).toBe("12:00 AM");
    expect(formatTime12("12:30")).toBe("12:30 PM");
    expect(formatTime12("16:05")).toBe("4:05 PM");
  });

  it("knows whether an appointment has started", () => {
    const now = { dateISO: "2026-09-21", minutes: 10 * 60 };
    expect(hasStarted("2026-09-20", "23:00", now)).toBe(true);
    expect(hasStarted("2026-09-21", "09:30", now)).toBe(true);
    expect(hasStarted("2026-09-21", "10:30", now)).toBe(false);
    expect(hasStarted("2026-09-22", "08:00", now)).toBe(false);
  });
});
