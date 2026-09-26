/**
 * Demo data for DentiCare360. Everything here is FICTIONAL — people, doctors,
 * clinics, appointments and reviews are invented for demonstration only.
 *
 *   npm run db:seed     wipes the database and re-creates the demo dataset
 *
 * Refuses to run against production unless SEED_ALLOW_PRODUCTION=1.
 */
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { rmSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { generateAiTurn, buildDoctorSummary, type AiConversationContext } from "../src/lib/ai-assistant";
import { findOpenSlot } from "../src/lib/availability";
import { addDays, clinicNow, dayOfWeek } from "../src/lib/time";
import { saveFile } from "../src/services/storage";
import { doctors as doctorSeed } from "./seed-data/doctors";
import { services as serviceSeed } from "./seed-data/services";
import { specialties as specialtySeed } from "./seed-data/specialties";
import type { Doctor } from "../src/types";

process.loadEnvFile?.(".env.local");

if (process.env.NODE_ENV === "production" && process.env.SEED_ALLOW_PRODUCTION !== "1") {
  console.error("Refusing to seed a production database. Set SEED_ALLOW_PRODUCTION=1 to override.");
  process.exit(1);
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL!, max: 5 }) });

const DEMO_PASSWORD = "password123";
const passwordHash = bcrypt.hashSync(DEMO_PASSWORD, 10);
const today = clinicNow().dateISO;

const DOCTOR_EMAILS: Record<string, string> = {
  "doc-1": "doctor@denticare360.com",
  "doc-2": "marcus.webb@denticare360.com",
  "doc-3": "priya.nair@denticare360.com",
  "doc-4": "julian.ferreira@denticare360.com",
  "doc-5": "sarah.kim@denticare360.com",
  "doc-6": "michael.otieno@denticare360.com",
  "doc-7": "elena.rossi@denticare360.com",
  "doc-8": "grace.thompson@denticare360.com",
};

/** A minimal but valid single-page PDF, so seeded documents genuinely open. */
function simplePdf(title: string, lines: string[]): Uint8Array {
  const esc = (s: string) => s.replace(/[()\\]/g, "\\$&");
  const content = ["BT /F1 16 Tf 56 760 Td (" + esc(title) + ") Tj ET"]
    .concat(lines.map((l, i) => `BT /F1 11 Tf 56 ${730 - i * 18} Td (${esc(l)}) Tj ET`))
    .join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((o, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((o) => (pdf += `${String(o).padStart(10, "0")} 00000 n \n`));
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

async function reset() {
  // Uploaded files belong to rows that are about to be deleted — don't leave orphans behind.
  rmSync(process.env.UPLOAD_DIR ?? ".data/uploads", { recursive: true, force: true });
  // Children before parents.
  await db.auditLog.deleteMany();
  await db.invoice.deleteMany();
  await db.payment.deleteMany();
  await db.notification.deleteMany();
  await db.appointment.deleteMany();
  await db.appointmentSlot.deleteMany();
  await db.aiMessage.deleteMany();
  await db.aiConversation.deleteMany();
  await db.medicalDocument.deleteMany();
  await db.medicalProfile.deleteMany();
  await db.doctorBlockedDate.deleteMany();
  await db.doctorAvailability.deleteMany();
  await db.doctor.deleteMany();
  await db.patient.deleteMany();
  await db.service.deleteMany();
  await db.specialty.deleteMany();
  await db.user.deleteMany();
}

async function main() {
  await reset();

  // ---- catalog
  const specialtyIds = new Map<string, string>();
  for (const s of specialtySeed) {
    const row = await db.specialty.create({ data: { name: s.name, slug: s.slug, description: s.description, icon: s.icon } });
    specialtyIds.set(s.slug, row.id);
  }
  const serviceIds = new Map<string, string>();
  for (const s of serviceSeed) {
    const row = await db.service.create({
      data: {
        name: s.name,
        slug: s.slug,
        category: s.category,
        description: s.description,
        durationMinutes: s.durationMinutes,
        startingPrice: s.startingPrice,
        specialistLabel: s.suitableSpecialist,
        specialtyId: specialtyIds.get(s.specialtySlug)!,
      },
    });
    serviceIds.set(s.slug, row.id);
  }

  // ---- staff
  await db.user.create({
    data: { email: "admin@denticare360.com", name: "Alex Rivera", role: "ADMIN", passwordHash },
  });

  const doctorIds = new Map<string, string>(); // seed id -> db id
  const doctorModels = new Map<string, Doctor>(); // db id -> schedule model for slot generation
  const doctorUserIds = new Map<string, string>(); // db id -> user id
  for (const d of doctorSeed) {
    const user = await db.user.create({
      data: { email: DOCTOR_EMAILS[d.id], name: d.name, role: "DOCTOR", passwordHash },
    });
    const row = await db.doctor.create({
      data: {
        userId: user.id,
        specialtyId: specialtyIds.get(d.specialtySlug)!,
        title: d.specialtyName,
        bio: d.bio,
        qualifications: d.qualifications,
        areasOfExpertise: d.areasOfExpertise,
        languages: d.languages,
        experienceYears: d.experienceYears,
        consultationFee: d.consultationFee,
        rating: d.rating,
        reviewCount: d.reviewCount,
        location: d.location,
        supportsOnline: d.supportsOnline,
        supportsInPerson: d.supportsInPerson,
        // Dr. Nair reviews new bookings before confirming (demonstrates the accept flow).
        autoConfirm: d.id !== "doc-3",
        // Dr. Ferreira is away — demonstrates the "temporarily unavailable" state.
        isTemporarilyUnavailable: d.isTemporarilyUnavailable,
        unavailableReason: d.unavailableReason ?? null,
        availability: {
          create: d.availability.map((a) => ({
            dayOfWeek: a.dayOfWeek,
            startTime: a.startTime,
            endTime: a.endTime,
            breakStart: a.breakStart ?? null,
            breakEnd: a.breakEnd ?? null,
            isActive: a.isActive,
          })),
        },
      },
    });
    doctorIds.set(d.id, row.id);
    doctorUserIds.set(row.id, user.id);
    doctorModels.set(row.id, { ...d, id: row.id, autoConfirm: true, isActive: true, blockedDates: [], holidays: [], isTemporarilyUnavailable: false } as Doctor);
  }

  // Sarah Kim is on leave for three days; Marcus Webb has a clinic holiday.
  const blocked: { doctor: string; offset: number; kind: "LEAVE" | "HOLIDAY"; reason: string }[] = [
    { doctor: "doc-5", offset: 3, kind: "LEAVE", reason: "Annual leave" },
    { doctor: "doc-5", offset: 4, kind: "LEAVE", reason: "Annual leave" },
    { doctor: "doc-5", offset: 5, kind: "LEAVE", reason: "Annual leave" },
    { doctor: "doc-2", offset: 10, kind: "HOLIDAY", reason: "Clinic holiday" },
  ];
  for (const b of blocked) {
    const date = addDays(today, b.offset);
    const id = doctorIds.get(b.doctor)!;
    await db.doctorBlockedDate.create({ data: { doctorId: id, date, kind: b.kind, reason: b.reason } });
    doctorModels.get(id)!.holidays.push(date);
  }

  // ---- patients
  const patientSeed = [
    { key: "jordan", name: "Jordan Lee", email: "patient@denticare360.com", phone: "+1 555 0142" },
    { key: "maya", name: "Maya Patel", email: "maya.patel@example.com", phone: "+1 555 0177" },
    { key: "liam", name: "Liam O'Connor", email: "liam.oconnor@example.com", phone: "+1 555 0163" },
    { key: "sofia", name: "Sofia Alvarez", email: "sofia.alvarez@example.com", phone: "+1 555 0118" },
    { key: "noah", name: "Noah Kim", email: "noah.kim@example.com", phone: "+1 555 0129" },
  ];
  const patients = new Map<string, { id: string; userId: string; name: string }>();
  for (const p of patientSeed) {
    const user = await db.user.create({ data: { email: p.email, name: p.name, phone: p.phone, role: "PATIENT", passwordHash } });
    const patient = await db.patient.create({ data: { userId: user.id } });
    patients.set(p.key, { id: patient.id, userId: user.id, name: p.name });
  }

  const profiles: Record<string, { allergies: string[]; currentMedications: string[]; medicalHistory: string; contact: [string, string] }> = {
    jordan: { allergies: ["Penicillin"], currentMedications: ["Vitamin D 1000 IU daily"], medicalHistory: "No major surgeries. Mild seasonal allergies.", contact: ["Sam Lee", "555-0199"] },
    maya: { allergies: [], currentMedications: [], medicalHistory: "Wisdom teeth removed in 2022.", contact: ["Anil Patel", "555-0121"] },
    liam: { allergies: ["Latex"], currentMedications: [], medicalHistory: "Asthma, well controlled.", contact: ["Aoife O'Connor", "555-0132"] },
    sofia: { allergies: [], currentMedications: [], medicalHistory: "", contact: ["", ""] },
    noah: { allergies: ["Peanuts"], currentMedications: [], medicalHistory: "Eczema as a child.", contact: ["Grace Kim", "555-0144"] },
  };
  for (const [key, pr] of Object.entries(profiles)) {
    await db.medicalProfile.create({
      data: {
        patientId: patients.get(key)!.id,
        allergies: pr.allergies,
        currentMedications: pr.currentMedications,
        medicalHistory: pr.medicalHistory,
        emergencyContactName: pr.contact[0],
        emergencyContactPhone: pr.contact[1],
      },
    });
  }

  // ---- AI conversations (generated by the real rule engine)
  async function aiConversation(patientKey: string | null, patientMessages: string[]) {
    const patientId = patientKey ? patients.get(patientKey)!.id : null;
    const guestKey = patientKey ? null : randomBytes(24).toString("base64url");
    const conv = await db.aiConversation.create({ data: { patientId, guestKeyHash: null } });
    let context: AiConversationContext = { stage: "new" };
    const transcript: { sender: "PATIENT" | "AI"; content: string }[] = [];
    let urgency: "LOW" | "HIGH" | "EMERGENCY" = "LOW";
    let t = Date.now() - 3 * 86_400_000;
    for (const [i, message] of patientMessages.entries()) {
      const turn = generateAiTurn(i, message, context);
      context = turn.context;
      if (turn.urgency !== "LOW") urgency = turn.urgency as typeof urgency;
      transcript.push({ sender: "PATIENT", content: message }, { sender: "AI", content: turn.reply });
      await db.aiMessage.createMany({
        data: [
          { conversationId: conv.id, sender: "PATIENT", content: message, createdAt: new Date((t += 20_000)) },
          { conversationId: conv.id, sender: "AI", content: turn.reply, createdAt: new Date((t += 8_000)) },
        ],
      });
    }
    const summary = buildDoctorSummary(transcript, context.specialtyLabel);
    await db.aiConversation.update({
      where: { id: conv.id },
      data: {
        urgency,
        stage: context.stage,
        specialtySlug: context.specialtySlug ?? null,
        serviceSlug: context.serviceSlug ?? null,
        specialtyLabel: context.specialtyLabel ?? null,
        summary,
      },
    });
    void guestKey;
    return { id: conv.id, summary };
  }

  const jordanAcneChat = await aiConversation("jordan", ["I have acne on my chin that keeps coming back", "It's been about three weeks and it's getting worse"]);
  const mayaToothChat = await aiConversation("maya", ["I have tooth pain on the lower left side", "About three days, it hurts more with cold drinks"]);
  await aiConversation("liam", ["My gums are bleeding when I brush"]);
  await aiConversation(null, ["I have chest pain and I can't breathe properly"]);
  await aiConversation(null, ["I need a dentist"]);

  // ---- appointments
  const patientAppointments: Awaited<ReturnType<typeof createAppointment>>[] = [];

  /** Creates an appointment (and its claimed slot) on the first free working day at/after `offset`. */
  async function createAppointment(opts: {
    doctor: string;
    patient: string;
    offset: number;
    time: string;
    service: string;
    status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "RESCHEDULED" | "NO_SHOW";
    online?: boolean;
    notes?: string;
    doctorNotes?: string;
    aiSummary?: string;
    aiConversationId?: string;
    payment?: "PENDING" | "PAID";
  }) {
    const doctorId = doctorIds.get(opts.doctor)!;
    const model = doctorModels.get(doctorId)!;
    const patient = patients.get(opts.patient)!;
    const isPast = opts.offset < 0;

    let date = addDays(today, opts.offset);
    let startTime = opts.time;
    let endTime = "";
    // Walk forward (or backward for history) to the nearest working day where the slot is free.
    for (let guard = 0; guard < 30; guard++) {
      const claimed = await db.appointmentSlot.findMany({ where: { doctorId, date }, select: { startTime: true } });
      const workday = model.availability.some((a) => a.dayOfWeek === dayOfWeek(date) && a.isActive) && !model.holidays.includes(date);
      const day = model.availability.find((a) => a.dayOfWeek === dayOfWeek(date));
      const wanted = day && opts.time < day.startTime ? day.startTime : opts.time;
      // History and same-day slots are seeded as-is; future slots must be genuinely open.
      const probeNow = isPast || date === today ? { dateISO: "0000-00-00", minutes: 0 } : clinicNow();
      const slot = workday ? findOpenSlot(model, date, wanted, new Set(claimed.map((c) => c.startTime)), probeNow) : null;
      if (slot) {
        startTime = slot.startTime;
        endTime = slot.endTime;
        break;
      }
      date = addDays(date, isPast ? -1 : 1);
    }
    if (!endTime) throw new Error(`Could not place seeded appointment ${JSON.stringify({ d: opts.doctor, p: opts.patient, o: opts.offset, t: opts.time })}`);

    const releasesSlot = opts.status === "CANCELLED";
    const slotRow = releasesSlot ? null : await db.appointmentSlot.create({ data: { doctorId, date, startTime, endTime } });
    const service = serviceSeed.find((s) => s.slug === opts.service)!;

    const appointment = await db.appointment.create({
      data: {
        patientId: patient.id,
        doctorId,
        serviceId: serviceIds.get(opts.service)!,
        slotId: slotRow?.id ?? null,
        date,
        startTime,
        endTime,
        consultationType: opts.online ? "ONLINE" : "IN_PERSON",
        status: opts.status,
        patientName: patient.name,
        notes: opts.notes,
        doctorNotes: opts.doctorNotes,
        aiSummary: opts.aiSummary,
        aiConversationId: opts.aiConversationId,
      },
    });
    if (opts.online) await db.appointment.update({ where: { id: appointment.id }, data: { meetingUrl: `/consultation/${appointment.id}` } });

    const fee = doctorSeed.find((d) => d.id === opts.doctor)!.consultationFee;
    const payStatus = opts.status === "CANCELLED" ? "CANCELLED" : (opts.payment ?? (opts.status === "COMPLETED" ? "PAID" : "PENDING"));
    const payment = await db.payment.create({
      data: {
        appointmentId: appointment.id,
        patientId: patient.id,
        amount: fee,
        status: payStatus,
        provider: "demo",
        providerRef: payStatus === "PAID" ? `demo_txn_${randomBytes(6).toString("hex")}` : null,
        createdAt: new Date(`${date}T08:00:00Z`),
      },
    });
    if (payStatus === "PAID") {
      await db.invoice.create({
        data: { paymentId: payment.id, invoiceNumber: `INV-${date.slice(0, 4)}-${randomBytes(3).toString("hex").toUpperCase()}` },
      });
    }
    void service;
    return { id: appointment.id, date, startTime, doctorId, patientId: patient.id };
  }

  // Jordan Lee (demo patient)
  patientAppointments.push(
    await createAppointment({ doctor: "doc-1", patient: "jordan", offset: 2, time: "10:00", service: "general-dentistry", status: "CONFIRMED", notes: "Routine checkup" }),
    await createAppointment({ doctor: "doc-3", patient: "jordan", offset: 5, time: "11:00", service: "acne", status: "CONFIRMED", online: true, payment: "PAID", aiSummary: jordanAcneChat.summary, aiConversationId: jordanAcneChat.id, notes: "Booked after chatting with the AI assistant" }),
    await createAppointment({ doctor: "doc-3", patient: "jordan", offset: -10, time: "11:00", service: "acne", status: "COMPLETED", online: true, notes: "Follow-up on acne", doctorNotes: "Skin improving. Continue the current gentle routine and review in six weeks." }),
    await createAppointment({ doctor: "doc-1", patient: "jordan", offset: -30, time: "09:30", service: "dental-cleaning", status: "COMPLETED", doctorNotes: "Routine cleaning completed. No concerns noted." }),
    await createAppointment({ doctor: "doc-5", patient: "jordan", offset: 7, time: "14:00", service: "general-physician", status: "CANCELLED", notes: "Cancelled — schedule clash" }),
  );

  // Other patients — populate the doctor and admin views
  await createAppointment({ doctor: "doc-1", patient: "maya", offset: 0, time: "09:00", service: "emergency-dental", status: "CONFIRMED", aiSummary: mayaToothChat.summary, aiConversationId: mayaToothChat.id });
  await createAppointment({ doctor: "doc-1", patient: "liam", offset: 0, time: "11:30", service: "gum-care", status: "CONFIRMED" });
  await createAppointment({ doctor: "doc-1", patient: "sofia", offset: 0, time: "15:00", service: "teeth-whitening", status: "CONFIRMED" });
  await createAppointment({ doctor: "doc-1", patient: "noah", offset: 3, time: "14:00", service: "general-dentistry", status: "PENDING", notes: "First visit" });
  await createAppointment({ doctor: "doc-1", patient: "maya", offset: -14, time: "10:30", service: "gum-care", status: "COMPLETED", doctorNotes: "Mild gum inflammation. Recommend a follow-up review in 4 weeks." });
  await createAppointment({ doctor: "doc-2", patient: "sofia", offset: 1, time: "10:00", service: "clear-aligners", status: "CONFIRMED" });
  await createAppointment({ doctor: "doc-3", patient: "noah", offset: 2, time: "15:00", service: "skin-allergy", status: "PENDING" });
  await createAppointment({ doctor: "doc-4", patient: "liam", offset: -6, time: "12:00", service: "anti-aging", status: "COMPLETED", online: true, doctorNotes: "Discussed a sun-protection routine." });
  await createAppointment({ doctor: "doc-8", patient: "maya", offset: 1, time: "11:00", service: "hair-loss", status: "CONFIRMED", online: true, payment: "PAID" });
  await createAppointment({ doctor: "doc-7", patient: "noah", offset: -5, time: "09:00", service: "dental-cleaning", status: "NO_SHOW" });

  // ---- notifications
  const jordan = patients.get("jordan")!;
  await db.notification.createMany({
    data: [
      { userId: jordan.userId, type: "APPOINTMENT_CONFIRMED", title: "Appointment confirmed", message: "Your appointment with Dr. Amara Chen is confirmed.", isRead: false },
      { userId: jordan.userId, type: "APPOINTMENT_REMINDER", title: "Appointment reminder", message: "Reminder: you have an upcoming online consultation with Dr. Priya Nair.", isRead: false },
      { userId: jordan.userId, type: "APPOINTMENT_CANCELLED", title: "Appointment cancelled", message: "Your appointment with Dr. Sarah Kim has been cancelled.", isRead: true },
      { userId: doctorUserIds.get(doctorIds.get("doc-1")!)!, type: "GENERAL", title: "New appointment request", message: "Noah Kim requested General Dentistry. Please review and accept.", isRead: false },
      { userId: doctorUserIds.get(doctorIds.get("doc-3")!)!, type: "GENERAL", title: "New appointment request", message: "Noah Kim requested Skin Allergy. Please review and accept.", isRead: false },
    ],
  });

  // ---- documents (real, viewable PDFs in private storage)
  const docs: { title: string; lines: string[]; name: string; category: string }[] = [
    { title: "Dental X-ray Summary (DEMO)", name: "Dental_Xray_Summary.pdf", category: "dental_record", lines: ["Patient: Jordan Lee (fictional demo record)", "Bitewing radiographs reviewed.", "No concerns noted. Routine recall recommended.", "", "This is fictional demo data."] },
    { title: "Blood Test Report (DEMO)", name: "Blood_Test_Report.pdf", category: "report", lines: ["Patient: Jordan Lee (fictional demo record)", "All values within the reference range.", "", "This is fictional demo data."] },
  ];
  for (const d of docs) {
    const bytes = simplePdf(d.title, d.lines);
    const key = await saveFile(bytes, "application/pdf");
    await db.medicalDocument.create({
      data: { patientId: jordan.id, fileName: d.name, storageKey: key, mimeType: "application/pdf", sizeBytes: bytes.byteLength, category: d.category },
    });
  }

  const counts = {
    users: await db.user.count(),
    doctors: await db.doctor.count(),
    services: await db.service.count(),
    appointments: await db.appointment.count(),
    slots: await db.appointmentSlot.count(),
    aiConversations: await db.aiConversation.count(),
    payments: await db.payment.count(),
  };
  console.log("Seeded demo data:", counts);
  console.log(`Demo accounts (password: ${DEMO_PASSWORD}): patient@denticare360.com · doctor@denticare360.com · admin@denticare360.com`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
