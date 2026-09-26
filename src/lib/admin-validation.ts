import { z } from "zod";
import { passwordSchema } from "@/lib/validation";

const trimmed = (max: number, min = 1) => z.string().trim().min(min).max(max);
const list = (maxItems: number, maxLen: number) => z.array(z.string().trim().min(1).max(maxLen)).max(maxItems);

/** Admin "Add doctor" form. The initial password is set by the admin and handed to the doctor out of band. */
export const createDoctorSchema = z
  .object({
    name: trimmed(100, 2),
    email: z.email().max(254).transform((e) => e.toLowerCase()),
    password: passwordSchema,
    specialtySlug: trimmed(60),
    title: trimmed(100, 2),
    bio: trimmed(2000, 10),
    qualifications: list(10, 120).default([]),
    areasOfExpertise: list(15, 80).default([]),
    languages: list(10, 40).min(1, "Add at least one language."),
    experienceYears: z.number("Enter years of experience.").int("Use whole years.").min(0, "Experience cannot be negative.").max(70, "Enter a realistic number of years."),
    consultationFee: z.number("Enter a fee.").min(0, "The fee cannot be negative.").max(10_000, "The fee cannot exceed $10,000."),
    location: trimmed(120).optional(),
    supportsOnline: z.boolean().default(true),
    supportsInPerson: z.boolean().default(true),
  })
  .refine((d) => d.supportsOnline || d.supportsInPerson, {
    path: ["supportsInPerson"],
    message: "Offer at least one consultation type.",
  });

export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;
