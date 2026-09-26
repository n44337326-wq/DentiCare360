import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startTestDatabase } from "@/test/test-db";
import { bookingInput, createDoctor, createPatient, createWorld, futureDate, type World } from "@/test/fixtures";
import { resetRateLimits } from "@/lib/rate-limit";

/**
 * Role permissions and protected-record access, exercised against the real
 * database: who may see or change which appointments, patient records,
 * documents, payments, notifications and AI conversations.
 */
let stop: () => Promise<void>;
let db: typeof import("@/database/client").db;
let appts: typeof import("@/services/appointments");
let users: typeof import("@/services/users");
let docs: typeof import("@/services/documents");
let payments: typeof import("@/services/payments");
let notifications: typeof import("@/services/notifications");
let ai: typeof import("@/services/ai");
let w: World;
let apptA: { id: string };

const pdf = (text = "hello") => new TextEncoder().encode(`%PDF-1.4\n${text}\n%%EOF`);

beforeAll(async () => {
  stop = (await startTestDatabase()).stop;
  db = (await import("@/database/client")).db;
  appts = await import("@/services/appointments");
  users = await import("@/services/users");
  docs = await import("@/services/documents");
  payments = await import("@/services/payments");
  notifications = await import("@/services/notifications");
  ai = await import("@/services/ai");
  w = await createWorld(db);
  apptA = await appts.bookAppointment(w.patientA.user, bookingInput(w, { date: futureDate(4), startTime: "09:00" }));
}, 90_000);

afterAll(async () => {
  await db.$disconnect();
  await stop();
});

describe("appointment visibility", () => {
  it("scopes listings by role", async () => {
    const other = await appts.bookAppointment(w.patientB.user, bookingInput(w, { doctorId: w.otherDoctor.id, date: futureDate(4), startTime: "09:00" }));

    const mine = await appts.listAppointmentsForUser(w.patientA.user);
    expect(mine.every((a) => a.patientId === w.patientA.id)).toBe(true);
    expect(mine.map((a) => a.id)).toContain(apptA.id);
    expect(mine.map((a) => a.id)).not.toContain(other.id);

    const alpha = await appts.listAppointmentsForUser(w.doctor.user);
    expect(alpha.every((a) => a.doctorId === w.doctor.id)).toBe(true);
    expect(alpha.map((a) => a.id)).not.toContain(other.id);

    const all = await appts.listAppointmentsForUser(w.admin);
    expect(all.map((a) => a.id)).toEqual(expect.arrayContaining([apptA.id, other.id]));
  });

  it("blocks reading someone else's appointment", async () => {
    await expect(appts.getAppointmentForUser(w.patientB.user, apptA.id)).rejects.toMatchObject({ status: 403 });
    await expect(appts.getAppointmentForUser(w.otherDoctor.user, apptA.id)).rejects.toMatchObject({ status: 403 });
    await expect(appts.getAppointmentForUser(w.doctor.user, apptA.id)).resolves.toMatchObject({ id: apptA.id });
    await expect(appts.getAppointmentForUser(w.admin, apptA.id)).resolves.toMatchObject({ id: apptA.id });
    await expect(appts.getAppointmentForUser(w.admin, "does-not-exist")).rejects.toMatchObject({ status: 404 });
  });

  it("blocks a doctor from acting on another doctor's appointment", async () => {
    await expect(appts.applyAppointmentAction(w.otherDoctor.user, apptA.id, { action: "cancel" })).rejects.toMatchObject({ status: 403 });
    await expect(appts.applyAppointmentAction(w.otherDoctor.user, apptA.id, { action: "note", doctorNotes: "peeking" })).rejects.toMatchObject({ status: 403 });
  });

  it("blocks patients from clinical actions on their own appointment", async () => {
    for (const action of [{ action: "accept" }, { action: "complete", doctorNotes: "self-certified" }, { action: "no_show" }, { action: "note", doctorNotes: "x" }] as const) {
      await expect(appts.applyAppointmentAction(w.patientA.user, apptA.id, action)).rejects.toMatchObject({ code: "ACTION_NOT_ALLOWED" });
    }
    expect((await appts.getAppointmentForUser(w.patientA.user, apptA.id)).doctorNotes).toBeUndefined();
  });
});

describe("patient records", () => {
  it("lets a treating doctor open the record, and audit-logs the access", async () => {
    const record = await users.getPatientRecordForDoctor(w.doctor.user, w.patientA.id, "203.0.113.5");
    expect(record.id).toBe(w.patientA.id);
    const log = await db.auditLog.findFirst({ where: { action: "PATIENT_RECORD_VIEWED", entityId: w.patientA.id, userId: w.doctor.userId } });
    expect(log?.ipAddress).toBe("203.0.113.5");
  });

  it("refuses doctors with no relationship to the patient, and patients themselves", async () => {
    const stranger = await createDoctor(db, w.specialtyId, { name: "Dr. Stranger" });
    await expect(users.getPatientRecordForDoctor(stranger.user, w.patientA.id)).rejects.toMatchObject({ status: 403 });
    await expect(users.getPatientRecordForDoctor(w.patientB.user, w.patientA.id)).rejects.toMatchObject({ status: 403 });
    await expect(users.getPatientRecordForDoctor(w.admin, w.patientA.id)).resolves.toBeTruthy();
  });

  it("saves and reads the medical profile, with an audit entry", async () => {
    await users.saveMedicalProfile(w.patientA.user, w.patientA.id, {
      allergies: ["Latex"],
      currentMedications: ["Vitamin D"],
      medicalHistory: "Asthma",
      emergencyContactName: "Sam",
      emergencyContactPhone: "555-0100",
    });
    expect(await users.getMedicalProfile(w.patientA.id)).toMatchObject({ allergies: ["Latex"], medicalHistory: "Asthma" });
    expect(await users.getMedicalProfile(w.patientB.id)).toMatchObject({ allergies: [], medicalHistory: "" }); // isolation
    expect(await db.auditLog.count({ where: { action: "MEDICAL_PROFILE_UPDATED", entityId: w.patientA.id } })).toBe(1);
  });
});

describe("medical documents", () => {
  let docId: string;

  it("stores an uploaded PDF privately and never exposes its storage key", async () => {
    const item = await docs.uploadDocument(w.patientA.user, { name: "../../report.pdf", bytes: pdf() }, "report");
    docId = item.id;
    expect(item).toMatchObject({ fileName: "report.pdf", mimeType: "application/pdf", category: "report" });
    expect(JSON.stringify(item)).not.toMatch(/storageKey|\.pdf"?,"?storage/i);
    const row = await db.medicalDocument.findUniqueOrThrow({ where: { id: docId } });
    expect(row.storageKey).toMatch(/^[0-9a-f-]{36}\.pdf$/); // random key, not the user's file name
  });

  it("rejects files that are not what they claim to be, or are too big or empty", async () => {
    const exe = new Uint8Array([0x4d, 0x5a, 0x90, 0, 3, 0, 0, 0]);
    await expect(docs.uploadDocument(w.patientA.user, { name: "invoice.pdf", bytes: exe }, "report")).rejects.toMatchObject({ status: 400 });
    await expect(docs.uploadDocument(w.patientA.user, { name: "page.pdf", bytes: new TextEncoder().encode("<script>alert(1)</script>") }, "report")).rejects.toMatchObject({ status: 400 });
    await expect(docs.uploadDocument(w.patientA.user, { name: "e.pdf", bytes: new Uint8Array(0) }, "report")).rejects.toMatchObject({ status: 400 });
    const huge = new Uint8Array(5 * 1024 * 1024 + 1);
    huge.set(pdf().slice(0, 8));
    await expect(docs.uploadDocument(w.patientA.user, { name: "huge.pdf", bytes: huge }, "report")).rejects.toMatchObject({ status: 400 });
  });

  it("only lets patients upload", async () => {
    await expect(docs.uploadDocument(w.doctor.user, { name: "x.pdf", bytes: pdf() }, "report")).rejects.toMatchObject({ status: 403 });
  });

  it("lets the owner, a treating doctor and an admin download it — and logs each view", async () => {
    for (const viewer of [w.patientA.user, w.doctor.user, w.admin]) {
      const file = await docs.getDocumentFile(viewer, docId);
      expect(file.mimeType).toBe("application/pdf");
      expect(Buffer.from(file.bytes).toString()).toContain("%PDF-1.4");
    }
    expect(await db.auditLog.count({ where: { action: "DOCUMENT_VIEWED", entityId: docId } })).toBe(3);
  });

  it("hides it from other patients and unrelated doctors (as 'not found', so ids can't be probed)", async () => {
    const stranger = await createDoctor(db, w.specialtyId, { name: "Dr. Outsider" });
    await expect(docs.getDocumentFile(w.patientB.user, docId)).rejects.toMatchObject({ status: 404 });
    await expect(docs.getDocumentFile(stranger.user, docId)).rejects.toMatchObject({ status: 404 });
    await expect(docs.getDocumentFile(w.patientB.user, "no-such-id")).rejects.toMatchObject({ status: 404 });
  });

  it("only lets the owner delete", async () => {
    await expect(docs.deleteDocument(w.patientB.user, docId)).rejects.toMatchObject({ status: 404 });
    await expect(docs.deleteDocument(w.admin, docId)).rejects.toMatchObject({ status: 404 });
    await docs.deleteDocument(w.patientA.user, docId);
    await expect(docs.getDocumentFile(w.patientA.user, docId)).rejects.toMatchObject({ status: 404 });
  });
});

describe("payments and invoices", () => {
  it("settles through the provider, issues an invoice, and never twice", async () => {
    const appt = await appts.bookAppointment(w.patientA.user, bookingInput(w, { date: futureDate(6), startTime: "09:00" }));
    const payment = await db.payment.findUniqueOrThrow({ where: { appointmentId: appt.id } });

    const paid = await payments.payForAppointment(w.patientA.user, payment.id);
    expect(paid).toMatchObject({ status: "PAID", provider: "demo", amount: 60 });
    expect(paid.invoiceNumber).toMatch(/^INV-\d{4}-[0-9A-F]{6}$/);
    await expect(payments.payForAppointment(w.patientA.user, payment.id)).rejects.toMatchObject({ code: "ALREADY_PAID" });

    // No card data anywhere in what we stored.
    const stored = JSON.stringify(await db.payment.findUniqueOrThrow({ where: { id: payment.id }, include: { invoice: true } }));
    expect(stored).not.toMatch(/card|cvv|cvc|\b\d{13,19}\b/i);
  });

  it("only the owning patient can pay; doctors and other patients cannot", async () => {
    const appt = await appts.bookAppointment(w.patientA.user, bookingInput(w, { date: futureDate(6), startTime: "09:30" }));
    const payment = await db.payment.findUniqueOrThrow({ where: { appointmentId: appt.id } });
    await expect(payments.payForAppointment(w.patientB.user, payment.id)).rejects.toMatchObject({ status: 404 });
    await expect(payments.payForAppointment(w.doctor.user, payment.id)).rejects.toMatchObject({ status: 403 });
    await expect(payments.payForAppointment(w.admin, payment.id)).rejects.toMatchObject({ status: 403 });
  });

  it("scopes invoice access to the owner, the treating doctor and admins", async () => {
    const appt = await appts.bookAppointment(w.patientA.user, bookingInput(w, { date: futureDate(6), startTime: "10:00" }));
    const payment = await db.payment.findUniqueOrThrow({ where: { appointmentId: appt.id } });
    await expect(payments.getPaymentForViewer(w.patientA.user, payment.id)).resolves.toBeTruthy();
    await expect(payments.getPaymentForViewer(w.doctor.user, payment.id)).resolves.toBeTruthy();
    await expect(payments.getPaymentForViewer(w.admin, payment.id)).resolves.toBeTruthy();
    await expect(payments.getPaymentForViewer(w.patientB.user, payment.id)).rejects.toMatchObject({ status: 403 });
    await expect(payments.getPaymentForViewer(w.otherDoctor.user, payment.id)).rejects.toMatchObject({ status: 403 });
  });

  it("lists only the caller's own transactions", async () => {
    const mine = await payments.listPaymentsForPatient(w.patientA.id);
    expect(mine.length).toBeGreaterThan(0);
    expect(mine.every((p) => p.patientId === w.patientA.id)).toBe(true);
    expect((await payments.listAllPayments()).length).toBeGreaterThanOrEqual(mine.length);
  });
});

describe("notifications", () => {
  it("returns only the user's own, and only lets them mark their own as read", async () => {
    const mine = await notifications.listNotificationsForUser(w.patientA.userId);
    expect(mine.length).toBeGreaterThan(0);
    const theirs = await notifications.listNotificationsForUser(w.patientB.userId);
    expect(theirs.map((n) => n.id).filter((id) => mine.some((m) => m.id === id))).toEqual([]);

    await expect(notifications.markRead(w.patientB.userId, mine[0].id)).rejects.toMatchObject({ status: 403 });
    await notifications.markRead(w.patientA.userId, mine[0].id);
    expect((await notifications.listNotificationsForUser(w.patientA.userId)).find((n) => n.id === mine[0].id)?.isRead).toBe(true);
    const unread = await notifications.countUnread(w.patientA.userId);
    await notifications.markAllRead(w.patientA.userId);
    expect(await notifications.countUnread(w.patientA.userId)).toBe(0);
    expect(unread).toBeGreaterThan(0);
  });
});

describe("AI assistant conversations", () => {
  const chat = (over: Partial<Parameters<typeof ai.handleChatTurn>[0]> & { message: string }) =>
    ai.handleChatTurn({ user: null, ip: "198.51.100.1", ...over });

  it("lets guests use the assistant, but only the holder of the guest key can resume", async () => {
    const first = await chat({ message: "I have tooth pain for three days" });
    expect(first.guestKey).toBeTruthy();
    expect(first.reply).toMatch(/\?/);

    const resumed = await chat({ message: "it hurts with cold drinks", conversationId: first.conversationId, guestKey: first.guestKey });
    expect(resumed.showBookingCTA).toBe(true);
    expect(resumed.summary).toMatch(/^Patient-reported symptoms \(not a confirmed diagnosis\)/);

    await expect(chat({ message: "hi", conversationId: first.conversationId })).rejects.toMatchObject({ status: 404 }); // no key
    await expect(chat({ message: "hi", conversationId: first.conversationId, guestKey: "wrong" })).rejects.toMatchObject({ status: 404 });
    await expect(chat({ message: "hi", conversationId: first.conversationId, user: w.patientA.user })).rejects.toMatchObject({ status: 404 });
    await expect(ai.getConversationMessages(null, first.conversationId, first.guestKey)).resolves.toMatchObject({ messages: expect.any(Array) });
  });

  it("keeps a signed-in patient's conversation private to them", async () => {
    const first = await chat({ message: "I have acne", user: w.patientA.user });
    expect(first.guestKey).toBeUndefined(); // tied to the account instead
    await expect(chat({ message: "hi", user: w.patientB.user, conversationId: first.conversationId })).rejects.toMatchObject({ status: 404 });
    await expect(chat({ message: "hi", conversationId: first.conversationId, guestKey: "anything" })).rejects.toMatchObject({ status: 404 });
    await expect(chat({ message: "more", user: w.patientA.user, conversationId: first.conversationId })).resolves.toBeTruthy();
    expect((await ai.listConversationsForPatient(w.patientB.id)).some((c) => c.id === first.conversationId)).toBe(false);
    expect((await ai.listConversationsForPatient(w.patientA.id)).some((c) => c.id === first.conversationId)).toBe(true);
  });

  it("flags an emergency, offers no booking, and records an audit entry", async () => {
    const res = await chat({ message: "I have chest pain and can't breathe", user: w.patientA.user });
    expect(res).toMatchObject({ urgency: "EMERGENCY", showBookingCTA: false });
    expect(res.recommendation).toBeUndefined();
    expect(res.reply).toMatch(/emergency/i);
    expect(await db.auditLog.count({ where: { action: "AI_EMERGENCY_FLAGGED", entityId: res.conversationId } })).toBe(1);
  });

  it("recommends real doctors with their next available slot", async () => {
    const res = await chat({ message: "I need a dentist" });
    expect(res.showBookingCTA).toBe(true);
    expect(res.recommendation?.doctors.length).toBeGreaterThan(0);
    expect(res.recommendation?.doctors[0].nextAvailable).toMatchObject({ date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/), startTime: expect.stringMatching(/^\d{2}:\d{2}$/) });
  });

  it("limits how fast one person can use the assistant", async () => {
    resetRateLimits();
    const results = [];
    for (let i = 0; i < 22; i++) results.push(await chat({ message: "hello there", ip: "192.0.2.77" }).then(() => "ok", (e) => e.status));
    expect(results.slice(0, 20).every((r) => r === "ok")).toBe(true);
    expect(results.slice(20)).toEqual([429, 429]);
    // A different caller is unaffected.
    await expect(chat({ message: "hello there", ip: "192.0.2.78" })).resolves.toBeTruthy();
  });

  it("only admins may list or read conversations, and reading is audit-logged", async () => {
    await expect(ai.listAllConversations(w.patientA.user)).rejects.toMatchObject({ status: 403 });
    await expect(ai.listAllConversations(w.doctor.user)).rejects.toMatchObject({ status: 403 });
    const list = await ai.listAllConversations(w.admin);
    expect(list.length).toBeGreaterThan(0);
    const detail = await ai.getConversationForAdmin(w.admin, list[0].id, "203.0.113.9");
    expect(detail.messages?.length).toBeGreaterThan(0);
    expect(await db.auditLog.count({ where: { action: "AI_CONVERSATION_VIEWED", entityId: list[0].id } })).toBe(1);
    await expect(ai.getConversationForAdmin(w.patientA.user, list[0].id)).rejects.toMatchObject({ status: 403 });
  });
});

describe("patient registration side effects", () => {
  it("gives a new patient an empty medical profile and their own isolated data", async () => {
    const fresh = await createPatient(db, "Fresh Face");
    expect(await appts.listAppointmentsForUser(fresh.user)).toEqual([]);
    expect(await payments.listPaymentsForPatient(fresh.id)).toEqual([]);
    expect(await users.getMedicalProfile(fresh.id)).toMatchObject({ allergies: [], currentMedications: [] });
  });
});
