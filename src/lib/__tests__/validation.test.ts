import { describe, expect, it } from "vitest";
import {
  aiChatSchema,
  appointmentActionSchema,
  bookingSchema,
  doctorScheduleSchema,
  loginSchema,
  medicalProfileSchema,
  registerSchema,
  serviceInputSchema,
} from "@/lib/validation";

const validBooking = {
  doctorId: "doc1",
  serviceId: "svc1",
  date: "2026-09-25",
  startTime: "10:00",
  consultationType: "IN_PERSON",
  patientName: "Jane Doe",
};

describe("API input validation — booking", () => {
  it("accepts a well-formed booking", () => {
    expect(bookingSchema.safeParse(validBooking).success).toBe(true);
  });

  it.each([
    ["impossible date", { date: "2026-02-30" }],
    ["malformed date", { date: "25/09/2026" }],
    ["bad time", { startTime: "25:00" }],
    ["time without zero padding", { startTime: "9:30" }],
    ["unknown consultation type", { consultationType: "TELEPATHY" }],
    ["empty patient name", { patientName: " " }],
    ["one-character name", { patientName: "J" }],
    ["missing doctor", { doctorId: "" }],
    ["oversized notes", { notes: "x".repeat(1001) }],
  ])("rejects %s", (_label, patch) => {
    expect(bookingSchema.safeParse({ ...validBooking, ...patch }).success).toBe(false);
  });

  it("does not let a client choose the end time or price (unknown keys are dropped)", () => {
    const parsed = bookingSchema.parse({ ...validBooking, endTime: "23:59", price: 0, status: "COMPLETED", patientId: "someone-else" });
    expect(parsed).not.toHaveProperty("endTime");
    expect(parsed).not.toHaveProperty("price");
    expect(parsed).not.toHaveProperty("status");
    expect(parsed).not.toHaveProperty("patientId");
  });

  it("trims whitespace", () => {
    expect(bookingSchema.parse({ ...validBooking, patientName: "  Jane Doe  " }).patientName).toBe("Jane Doe");
  });
});

describe("API input validation — appointment actions", () => {
  it("accepts each valid action", () => {
    expect(appointmentActionSchema.safeParse({ action: "cancel" }).success).toBe(true);
    expect(appointmentActionSchema.safeParse({ action: "accept" }).success).toBe(true);
    expect(appointmentActionSchema.safeParse({ action: "reschedule", date: "2026-09-28", startTime: "11:30" }).success).toBe(true);
    expect(appointmentActionSchema.safeParse({ action: "complete", doctorNotes: "All good" }).success).toBe(true);
    expect(appointmentActionSchema.safeParse({ action: "note", doctorNotes: "Follow up in 4 weeks" }).success).toBe(true);
  });

  it("rejects unknown actions and incomplete payloads", () => {
    expect(appointmentActionSchema.safeParse({ action: "delete" }).success).toBe(false);
    expect(appointmentActionSchema.safeParse({ action: "reschedule", date: "2026-09-28" }).success).toBe(false);
    expect(appointmentActionSchema.safeParse({ action: "reschedule", date: "nope", startTime: "11:30" }).success).toBe(false);
    expect(appointmentActionSchema.safeParse({ action: "note", doctorNotes: "" }).success).toBe(false);
    expect(appointmentActionSchema.safeParse({}).success).toBe(false);
    expect(appointmentActionSchema.safeParse(null).success).toBe(false);
  });
});

describe("API input validation — accounts", () => {
  it("normalises the email and enforces password strength", () => {
    expect(registerSchema.parse({ name: "Jane Doe", email: "Jane@Example.COM", password: "abcdefg1" }).email).toBe("jane@example.com");
    expect(registerSchema.safeParse({ name: "Jane Doe", email: "jane@example.com", password: "short1" }).success).toBe(false);
    expect(registerSchema.safeParse({ name: "Jane Doe", email: "jane@example.com", password: "onlyletters" }).success).toBe(false);
    expect(registerSchema.safeParse({ name: "Jane Doe", email: "jane@example.com", password: "12345678" }).success).toBe(false);
    expect(registerSchema.safeParse({ name: "Jane Doe", email: "not-an-email", password: "abcdefg1" }).success).toBe(false);
    expect(registerSchema.safeParse({ name: "J", email: "jane@example.com", password: "abcdefg1" }).success).toBe(false);
  });

  it("does not allow a role to be supplied at sign-up", () => {
    const parsed = registerSchema.parse({ name: "Jane Doe", email: "jane@example.com", password: "abcdefg1", role: "ADMIN" });
    expect(parsed).not.toHaveProperty("role");
  });

  it("validates the phone number when given", () => {
    expect(registerSchema.safeParse({ name: "Jane Doe", email: "j@example.com", password: "abcdefg1", phone: "+1 555 0100" }).success).toBe(true);
    expect(registerSchema.safeParse({ name: "Jane Doe", email: "j@example.com", password: "abcdefg1", phone: "call me" }).success).toBe(false);
  });

  it("requires both login fields", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "nope", password: "x" }).success).toBe(false);
  });
});

describe("API input validation — doctor schedule", () => {
  const day = (over = {}) => ({ dayOfWeek: 1, isActive: true, startTime: "09:00", endTime: "17:00", ...over });

  it("accepts a sensible schedule", () => {
    expect(doctorScheduleSchema.safeParse({ availability: [day({ breakStart: "12:00", breakEnd: "13:00" })] }).success).toBe(true);
  });

  it.each([
    ["end before start", day({ startTime: "17:00", endTime: "09:00" })],
    ["break outside working hours", day({ breakStart: "08:00", breakEnd: "08:30" })],
    ["break ends before it starts", day({ breakStart: "13:00", breakEnd: "12:00" })],
    ["only one break time", day({ breakStart: "12:00" })],
    ["bad weekday", day({ dayOfWeek: 9 })],
    ["bad time format", day({ startTime: "9am" })],
  ])("rejects %s", (_label, d) => {
    expect(doctorScheduleSchema.safeParse({ availability: [d] }).success).toBe(false);
  });

  it("rejects duplicate weekdays and invalid blocked dates", () => {
    expect(doctorScheduleSchema.safeParse({ availability: [day(), day()] }).success).toBe(false);
    expect(doctorScheduleSchema.safeParse({ blockedDates: [{ date: "2026-13-01", kind: "LEAVE" }] }).success).toBe(false);
    expect(doctorScheduleSchema.safeParse({ blockedDates: [{ date: "2026-10-01", kind: "VACATION" }] }).success).toBe(false);
    expect(doctorScheduleSchema.safeParse({ blockedDates: [{ date: "2026-10-01", kind: "LEAVE", reason: "Conference" }] }).success).toBe(true);
  });
});

describe("API input validation — patient records, AI and admin", () => {
  it("validates the medical profile", () => {
    const ok = { allergies: ["Penicillin"], currentMedications: [], medicalHistory: "", emergencyContactName: "", emergencyContactPhone: "" };
    expect(medicalProfileSchema.safeParse(ok).success).toBe(true);
    expect(medicalProfileSchema.safeParse({ ...ok, emergencyContactPhone: "abc" }).success).toBe(false);
    expect(medicalProfileSchema.safeParse({ ...ok, allergies: [""] }).success).toBe(false);
    expect(medicalProfileSchema.safeParse({ ...ok, medicalHistory: "x".repeat(4001) }).success).toBe(false);
  });

  it("bounds AI chat messages", () => {
    expect(aiChatSchema.safeParse({ message: "I have tooth pain" }).success).toBe(true);
    expect(aiChatSchema.safeParse({ message: "   " }).success).toBe(false);
    expect(aiChatSchema.safeParse({ message: "x".repeat(1001) }).success).toBe(false);
    expect(aiChatSchema.safeParse({}).success).toBe(false);
  });

  it("validates admin service input", () => {
    const ok = { name: "Whitening", category: "Dental", description: "Brighter smile", durationMinutes: 60, startingPrice: 150, specialtySlug: "dental", suitableSpecialist: "Dentist" };
    expect(serviceInputSchema.safeParse(ok).success).toBe(true);
    expect(serviceInputSchema.safeParse({ ...ok, startingPrice: -1 }).success).toBe(false);
    expect(serviceInputSchema.safeParse({ ...ok, category: "Cosmetic Surgery" }).success).toBe(false);
    expect(serviceInputSchema.safeParse({ ...ok, durationMinutes: 0 }).success).toBe(false);
  });
});
