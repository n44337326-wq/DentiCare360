import { z } from "zod";

/** Contact-form payload, shared by the form (client) and POST /api/contact (server). */
export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(100),
  email: z.email("Enter a valid email address.").max(254),
  subject: z.string().trim().min(3, "Enter a subject (at least 3 characters).").max(150),
  message: z.string().trim().min(10, "Write a message of at least 10 characters.").max(2000, "Keep your message under 2000 characters."),
});
export type ContactInput = z.infer<typeof contactSchema>;
