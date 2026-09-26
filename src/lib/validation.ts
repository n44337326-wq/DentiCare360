import { z } from "zod";
import { isValidISODate, isValidTime, timeToMinutes } from "@/lib/time";

const trimmed = (max: number, min = 1) => z.string().trim().min(min).max(max);
// Empty strings become undefined. `.optional()` goes LAST so the inferred key stays optional (`key?:`).
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v ? v : undefined))
    .optional();

export const isoDate = z.string().refine(isValidISODate, "Use a valid date (YYYY-MM-DD).");
export const clockTime = z.string().refine(isValidTime, "Use a valid 24-hour time (HH:mm).");

// ---------- Authentication ----------

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(100)
  .refine((p) => /[A-Za-z]/.test(p) && /\d/.test(p), "Include at least one letter and one number.");

export const loginSchema = z.object({
  email: z.email().max(254).transform((e) => e.toLowerCase()),
  password: z.string().min(1).max(100),
});

export const registerSchema = z.object({
  name: trimmed(100, 2),
  email: z.email().max(254).transform((e) => e.toLowerCase()),
  password: passwordSchema,
  phone: z
    .string()
    .trim()
    .regex(/^[+\d][\d\s().-]{6,19}$/, "Enter a valid phone number.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

// ---------- Appointments ----------

export const bookingSchema = z.object({
  doctorId: trimmed(64),
  serviceId: trimmed(64),
  date: isoDate,
  startTime: clockTime,
  consultationType: z.enum(["IN_PERSON", "ONLINE"]),
  patientName: trimmed(150, 2),
  notes: optionalText(1000),
  /** Optional AI chat this booking follows; ownership is verified server-side. */
  aiConversationId: trimmed(64).optional(),
});
export type BookingInput = z.infer<typeof bookingSchema>;

export const appointmentActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("cancel"), reason: optionalText(300) }),
  z.object({ action: z.literal("accept") }),
  z.object({ action: z.literal("complete"), doctorNotes: optionalText(4000) }),
  z.object({ action: z.literal("no_show") }),
  z.object({ action: z.literal("reschedule"), date: isoDate, startTime: clockTime }),
  z.object({ action: z.literal("note"), doctorNotes: trimmed(4000) }),
]);
export type AppointmentAction = z.infer<typeof appointmentActionSchema>;

// ---------- Availability ----------

const weekdaySchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    isActive: z.boolean(),
    startTime: clockTime,
    endTime: clockTime,
    breakStart: clockTime.optional().nullable(),
    breakEnd: clockTime.optional().nullable(),
  })
  .superRefine((d, ctx) => {
    if (!d.isActive) return;
    const start = timeToMinutes(d.startTime);
    const end = timeToMinutes(d.endTime);
    if (end <= start) ctx.addIssue({ code: "custom", path: ["endTime"], message: "End time must be after start time." });
    const hasBreak = d.breakStart && d.breakEnd;
    if (!!d.breakStart !== !!d.breakEnd) {
      ctx.addIssue({ code: "custom", path: ["breakEnd"], message: "Set both break start and break end, or neither." });
    }
    if (hasBreak) {
      const bs = timeToMinutes(d.breakStart!);
      const be = timeToMinutes(d.breakEnd!);
      if (be <= bs) ctx.addIssue({ code: "custom", path: ["breakEnd"], message: "Break must end after it starts." });
      else if (bs < start || be > end) {
        ctx.addIssue({ code: "custom", path: ["breakStart"], message: "Break must fall within working hours." });
      }
    }
  });

export const blockedDateSchema = z.object({
  date: isoDate,
  kind: z.enum(["HOLIDAY", "LEAVE", "BLOCKED"]).default("BLOCKED"),
  reason: optionalText(200),
});

export const doctorScheduleSchema = z.object({
  availability: z
    .array(weekdaySchema)
    .max(7)
    .refine((days) => new Set(days.map((d) => d.dayOfWeek)).size === days.length, "Each weekday can appear once.")
    .optional(),
  blockedDates: z.array(blockedDateSchema).max(366).optional(),
  supportsOnline: z.boolean().optional(),
  supportsInPerson: z.boolean().optional(),
  isTemporarilyUnavailable: z.boolean().optional(),
  unavailableReason: optionalText(200),
  autoConfirm: z.boolean().optional(),
});
export type DoctorScheduleInput = z.infer<typeof doctorScheduleSchema>;

// ---------- Patient records ----------

const listOf = (maxItems: number, maxLen: number) =>
  z.array(z.string().trim().min(1).max(maxLen)).max(maxItems);

export const medicalProfileSchema = z.object({
  allergies: listOf(30, 100),
  currentMedications: listOf(30, 150),
  medicalHistory: z.string().trim().max(4000),
  emergencyContactName: z.string().trim().max(100),
  emergencyContactPhone: z
    .string()
    .trim()
    .max(20)
    .refine((v) => v === "" || /^[+\d][\d\s().-]{5,19}$/.test(v), "Enter a valid phone number."),
});

export const documentCategorySchema = z.enum(["report", "prescription", "dental_record", "other"]);

// ---------- AI assistant ----------

export const aiChatSchema = z.object({
  conversationId: trimmed(64).optional(),
  /** Secret returned when a guest conversation is created; required to resume it. */
  guestKey: trimmed(128).optional(),
  message: z.string().trim().min(1, "Type a message first.").max(1000),
});

// ---------- Admin ----------

export const adminDoctorUpdateSchema = z.object({
  consultationFee: z.number("Enter a fee.").min(0, "The fee cannot be negative.").max(10_000, "The fee cannot exceed $10,000.").optional(),
  isActive: z.boolean().optional(),
  isTemporarilyUnavailable: z.boolean().optional(),
  unavailableReason: optionalText(200),
  autoConfirm: z.boolean().optional(),
  location: optionalText(120),
  supportsOnline: z.boolean().optional(),
  supportsInPerson: z.boolean().optional(),
});

export const serviceInputSchema = z.object({
  name: trimmed(100, 2),
  category: z.enum(["Dental", "Skin & Dermatology", "General Health"]),
  description: trimmed(600, 5),
  durationMinutes: z.number("Enter the duration in minutes.").int("Use whole minutes.").min(5, "Duration must be at least 5 minutes.").max(480, "Duration cannot exceed 8 hours."),
  startingPrice: z.number("Enter a price.").min(0, "The price cannot be negative.").max(100_000, "The price is too high."),
  specialtySlug: trimmed(60),
  suitableSpecialist: trimmed(100),
  isActive: z.boolean().default(true),
});
export type ServiceInput = z.infer<typeof serviceInputSchema>;

export const serviceUpdateSchema = serviceInputSchema.partial();
