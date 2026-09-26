import { describe, expect, it } from "vitest";
import {
  explainUnavailability,
  findNextAvailable,
  findNextAvailableDates,
  findOpenSlot,
  generateSlotsForDate,
  getAvailabilityCalendar,
  unavailableMessage,
  type BookedByDate,
  type ScheduleDoctor,
} from "@/lib/availability";
import type { ClinicNow } from "@/lib/time";

// Fixed "now": Monday 2026-09-21, 08:00 clinic time. Weekdays used below:
// 2026-09-21 Mon · 22 Tue · 23 Wed · 24 Thu · 25 Fri · 26 Sat · 27 Sun · 28 Mon
const NOW: ClinicNow = { dateISO: "2026-09-21", minutes: 8 * 60 };

const workday = (dayOfWeek: number, over = {}) => ({
  dayOfWeek,
  startTime: "09:00",
  endTime: "17:00",
  breakStart: "12:00",
  breakEnd: "13:00",
  isActive: true,
  ...over,
});

const doctor = (over: Partial<ScheduleDoctor> = {}): ScheduleDoctor => ({
  isTemporarilyUnavailable: false,
  holidays: [],
  availability: [1, 2, 3, 4, 5].map((d) => workday(d)),
  ...over,
});

const times = (slots: { startTime: string }[]) => slots.map((s) => s.startTime);

describe("generateSlotsForDate — working hours and breaks", () => {
  it("generates 30-minute slots across working hours, skipping the break", () => {
    const slots = generateSlotsForDate(doctor(), "2026-09-22", new Set(), NOW);
    expect(slots).toHaveLength(14); // 09:00–12:00 (6) + 13:00–17:00 (8)
    expect(slots[0]).toMatchObject({ startTime: "09:00", endTime: "09:30", isBooked: false });
    expect(slots.at(-1)).toMatchObject({ startTime: "16:30", endTime: "17:00" });
    expect(times(slots)).not.toContain("12:00");
    expect(times(slots)).not.toContain("12:30");
    expect(times(slots)).toContain("13:00");
  });

  it("excludes any slot that merely overlaps an unaligned break", () => {
    const d = doctor({ availability: [workday(2, { breakStart: "12:15", breakEnd: "12:45" })] });
    const t = times(generateSlotsForDate(d, "2026-09-22", new Set(), NOW));
    expect(t).not.toContain("12:00"); // 12:00–12:30 overlaps 12:15
    expect(t).not.toContain("12:30"); // 12:30–13:00 overlaps until 12:45
    expect(t).toContain("11:30");
    expect(t).toContain("13:00");
  });

  it("works without a break", () => {
    const d = doctor({ availability: [workday(2, { breakStart: undefined, breakEnd: undefined })] });
    expect(generateSlotsForDate(d, "2026-09-22", new Set(), NOW)).toHaveLength(16);
  });

  it("returns nothing on days the doctor does not work", () => {
    expect(generateSlotsForDate(doctor(), "2026-09-26", new Set(), NOW)).toEqual([]); // Saturday
    expect(generateSlotsForDate(doctor(), "2026-09-27", new Set(), NOW)).toEqual([]); // Sunday
  });

  it("returns nothing on a day switched off", () => {
    const d = doctor({ availability: [workday(2, { isActive: false })] });
    expect(generateSlotsForDate(d, "2026-09-22", new Set(), NOW)).toEqual([]);
  });

  it("does not generate a slot that would run past closing time", () => {
    const d = doctor({ availability: [workday(2, { startTime: "09:00", endTime: "10:45", breakStart: undefined, breakEnd: undefined })] });
    expect(times(generateSlotsForDate(d, "2026-09-22", new Set(), NOW))).toEqual(["09:00", "09:30", "10:00"]);
  });
});

describe("generateSlotsForDate — holidays, leave and unavailability", () => {
  it("returns nothing on a holiday / leave / blocked date", () => {
    expect(generateSlotsForDate(doctor({ holidays: ["2026-09-22"] }), "2026-09-22", new Set(), NOW)).toEqual([]);
    expect(generateSlotsForDate(doctor({ holidays: ["2026-09-22"] }), "2026-09-23", new Set(), NOW)).not.toEqual([]);
  });

  it("returns nothing while the doctor is temporarily unavailable", () => {
    expect(generateSlotsForDate(doctor({ isTemporarilyUnavailable: true }), "2026-09-22", new Set(), NOW)).toEqual([]);
  });

  it("returns nothing for dates in the past", () => {
    expect(generateSlotsForDate(doctor(), "2026-09-14", new Set(), NOW)).toEqual([]);
  });

  it("hides slots that have already started today", () => {
    const at1015: ClinicNow = { dateISO: "2026-09-22", minutes: 10 * 60 + 15 };
    const t = times(generateSlotsForDate(doctor(), "2026-09-22", new Set(), at1015));
    expect(t[0]).toBe("10:30");
    expect(t).not.toContain("10:00");
  });

  it("does not offer the slot that starts exactly now", () => {
    const at1030: ClinicNow = { dateISO: "2026-09-22", minutes: 10 * 60 + 30 };
    expect(times(generateSlotsForDate(doctor(), "2026-09-22", new Set(), at1030))[0]).toBe("11:00");
  });
});

describe("booked slots and findOpenSlot — the engine never offers an unavailable slot", () => {
  const booked = new Set(["10:00", "10:30"]);

  it("marks claimed slots as booked", () => {
    const slots = generateSlotsForDate(doctor(), "2026-09-22", booked, NOW);
    expect(slots.filter((s) => s.isBooked).map((s) => s.startTime)).toEqual(["10:00", "10:30"]);
  });

  it("findOpenSlot refuses booked, break, out-of-hours, off-grid, past and blocked requests", () => {
    const d = doctor({ holidays: ["2026-09-24"] });
    expect(findOpenSlot(d, "2026-09-22", "10:00", booked, NOW)).toBeNull(); // booked
    expect(findOpenSlot(d, "2026-09-22", "12:00", new Set(), NOW)).toBeNull(); // break
    expect(findOpenSlot(d, "2026-09-22", "08:00", new Set(), NOW)).toBeNull(); // before opening
    expect(findOpenSlot(d, "2026-09-22", "17:00", new Set(), NOW)).toBeNull(); // at close
    expect(findOpenSlot(d, "2026-09-22", "10:10", new Set(), NOW)).toBeNull(); // off the 30-min grid
    expect(findOpenSlot(d, "2026-09-14", "10:00", new Set(), NOW)).toBeNull(); // past
    expect(findOpenSlot(d, "2026-09-24", "10:00", new Set(), NOW)).toBeNull(); // holiday
    expect(findOpenSlot(d, "2026-09-26", "10:00", new Set(), NOW)).toBeNull(); // weekend
  });

  it("findOpenSlot returns a genuinely open slot", () => {
    expect(findOpenSlot(doctor(), "2026-09-22", "11:00", booked, NOW)).toMatchObject({ startTime: "11:00", endTime: "11:30" });
  });
});

describe("next available", () => {
  const byDate = (entries: Record<string, string[]>): BookedByDate => new Map(Object.entries(entries).map(([d, t]) => [d, new Set(t)]));

  it("finds the first open slot today when there is one", () => {
    const next = findNextAvailable(doctor(), byDate({}), NOW);
    expect(next).toMatchObject({ date: "2026-09-21", slot: { startTime: "09:00" } });
  });

  it("skips fully booked days, holidays and weekends", () => {
    const allDay = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"];
    const d = doctor({ holidays: ["2026-09-23"] });
    // Mon full, Tue full, Wed holiday, Thu open
    const next = findNextAvailable(d, byDate({ "2026-09-21": allDay, "2026-09-22": allDay }), NOW);
    expect(next?.date).toBe("2026-09-24");
  });

  it("skips over the weekend to Monday", () => {
    const fri: ClinicNow = { dateISO: "2026-09-25", minutes: 17 * 60 };
    expect(findNextAvailable(doctor(), byDate({}), fri)?.date).toBe("2026-09-28");
  });

  it("starts scanning from the requested date", () => {
    expect(findNextAvailable(doctor(), byDate({}), NOW, { fromDate: "2026-09-24" })?.date).toBe("2026-09-24");
  });

  it("returns null when the doctor is unavailable for the whole window", () => {
    expect(findNextAvailable(doctor({ isTemporarilyUnavailable: true }), byDate({}), NOW, { daysToScan: 30 })).toBeNull();
  });

  it("lists several upcoming dates for the 'next available' suggestions", () => {
    const list = findNextAvailableDates(doctor(), byDate({}), NOW, { fromDate: "2026-09-25", count: 3 });
    expect(list.map((a) => a.date)).toEqual(["2026-09-25", "2026-09-28", "2026-09-29"]);
  });

  it("builds a calendar flagging days with availability", () => {
    const cal = getAvailabilityCalendar(doctor(), byDate({}), NOW, 8);
    expect(cal).toHaveLength(8);
    expect(cal.find((c) => c.date === "2026-09-26")?.hasAvailability).toBe(false); // Saturday
    expect(cal.find((c) => c.date === "2026-09-28")?.hasAvailability).toBe(true);
  });
});

describe("explainUnavailability — drives 'Dr. X is unavailable on <date>'", () => {
  it("reports the specific reason", () => {
    const full = new Set(["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"]);
    expect(explainUnavailability(doctor(), "2026-09-22", new Set(), NOW)).toBeNull();
    expect(explainUnavailability(doctor(), "2026-09-14", new Set(), NOW)).toBe("PAST_DATE");
    expect(explainUnavailability(doctor({ isTemporarilyUnavailable: true }), "2026-09-22", new Set(), NOW)).toBe("TEMPORARILY_UNAVAILABLE");
    expect(explainUnavailability(doctor({ holidays: ["2026-09-22"] }), "2026-09-22", new Set(), NOW)).toBe("BLOCKED_DATE");
    expect(explainUnavailability(doctor(), "2026-09-26", new Set(), NOW)).toBe("NOT_WORKING_DAY");
    expect(explainUnavailability(doctor(), "2026-09-22", full, NOW)).toBe("FULLY_BOOKED");
  });

  it("formats the patient-facing message", () => {
    expect(unavailableMessage("Dr. Sarah Kim", "2026-09-23")).toBe("Dr. Sarah Kim is unavailable on Wednesday, September 23.");
  });
});
