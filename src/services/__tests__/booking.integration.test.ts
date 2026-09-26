import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startTestDatabase } from "@/test/test-db";
import { bookingInput, createPatient, createWorld, futureDate, type World } from "@/test/fixtures";
import { addDays, clinicToday } from "@/lib/time";
import { SlotUnavailableError } from "@/lib/errors";

/**
 * Integration tests against a real PostgreSQL-compatible database with the
 * project's actual migrations: booking, double-booking prevention, doctor
 * availability, cancellation and rescheduling.
 */
let stop: () => Promise<void>;
let db: typeof import("@/database/client").db;
let appointments: typeof import("@/services/appointments");
let scheduling: typeof import("@/services/scheduling");
let w: World;

beforeAll(async () => {
  stop = (await startTestDatabase()).stop;
  db = (await import("@/database/client")).db;
  appointments = await import("@/services/appointments");
  scheduling = await import("@/services/scheduling");
  w = await createWorld(db);
}, 90_000);

afterAll(async () => {
  await db.$disconnect();
  await stop();
});

const notificationsFor = (userId: string) => db.notification.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });

describe("booking", () => {
  it("books an appointment, claims the slot, creates a pending payment and notifies both sides", async () => {
    const date = futureDate(4);
    const appt = await appointments.bookAppointment(w.patientA.user, bookingInput(w, { date, startTime: "09:00" }));

    expect(appt).toMatchObject({ date, startTime: "09:00", endTime: "09:30", status: "CONFIRMED", doctorName: "Dr. Alpha" });
    expect(await db.appointmentSlot.count({ where: { doctorId: w.doctor.id, date, startTime: "09:00" } })).toBe(1);

    const payment = await db.payment.findUnique({ where: { appointmentId: appt.id } });
    expect(payment).toMatchObject({ status: "PENDING", patientId: w.patientA.id });
    expect(Number(payment!.amount)).toBe(60);

    expect((await notificationsFor(w.patientA.userId)).some((n) => n.type === "APPOINTMENT_CONFIRMED")).toBe(true);
    expect((await notificationsFor(w.doctor.userId)).some((n) => n.title === "New appointment booked")).toBe(true);
    expect(await db.auditLog.count({ where: { action: "APPOINTMENT_BOOKED", entityId: appt.id } })).toBe(1);
  });

  it("computes the end time itself — the client cannot dictate it", async () => {
    const appt = await appointments.bookAppointment(
      w.patientA.user,
      { ...bookingInput(w, { date: futureDate(5), startTime: "10:00" }), endTime: "23:59" } as never
    );
    expect(appt.endTime).toBe("10:30");
  });

  it("gives online consultations a join link", async () => {
    const appt = await appointments.bookAppointment(w.patientB.user, bookingInput(w, { date: futureDate(6), startTime: "11:00", consultationType: "ONLINE" }));
    expect(appt.meetingUrl).toBe(`/consultation/${appt.id}`);
  });

  it("holds the booking as PENDING when the doctor requires approval, then confirms on accept", async () => {
    const strict = await (await import("@/test/fixtures")).createDoctor(db, w.specialtyId, { name: "Dr. Strict", autoConfirm: false });
    const appt = await appointments.bookAppointment(w.patientA.user, bookingInput(w, { doctorId: strict.id, date: futureDate(4), startTime: "09:30" }));
    expect(appt.status).toBe("PENDING");
    expect((await notificationsFor(strict.userId)).some((n) => n.title === "New appointment request")).toBe(true);

    const accepted = await appointments.applyAppointmentAction(strict.user, appt.id, { action: "accept" });
    expect(accepted.status).toBe("CONFIRMED");
    expect((await notificationsFor(w.patientA.userId)).filter((n) => n.type === "APPOINTMENT_CONFIRMED").length).toBeGreaterThan(1);
  });

  it("rejects doctors, services and consultation types that do not fit", async () => {
    // service belongs to another specialty
    await expect(appointments.bookAppointment(w.patientA.user, bookingInput(w, { serviceId: w.otherServiceId, date: futureDate(7) }))).rejects.toMatchObject({ status: 400 });
    // unknown doctor
    await expect(appointments.bookAppointment(w.patientA.user, bookingInput(w, { doctorId: "nope", date: futureDate(7) }))).rejects.toMatchObject({ status: 404 });
    // doctor without online consultations
    const inPersonOnly = await (await import("@/test/fixtures")).createDoctor(db, w.specialtyId, { supportsOnline: false });
    await expect(
      appointments.bookAppointment(w.patientA.user, bookingInput(w, { doctorId: inPersonOnly.id, date: futureDate(7), consultationType: "ONLINE" }))
    ).rejects.toMatchObject({ status: 400 });
  });

  it("only lets patients book", async () => {
    await expect(appointments.bookAppointment(w.doctor.user, bookingInput(w, { date: futureDate(8) }))).rejects.toMatchObject({ status: 403 });
    await expect(appointments.bookAppointment(w.admin, bookingInput(w, { date: futureDate(8) }))).rejects.toMatchObject({ status: 403 });
  });

  it("does not allow a patient to hold two appointments at the same time", async () => {
    const date = futureDate(9);
    await appointments.bookAppointment(w.patientA.user, bookingInput(w, { date, startTime: "14:00" }));
    await expect(
      appointments.bookAppointment(w.patientA.user, bookingInput(w, { doctorId: w.otherDoctor.id, date, startTime: "14:00" }))
    ).rejects.toMatchObject({ code: "PATIENT_DOUBLE_BOOKED" });
  });

  it("attaches the AI summary only from a conversation the patient owns", async () => {
    const own = await db.aiConversation.create({ data: { patientId: w.patientA.id, summary: "Patient-reported symptoms (not a confirmed diagnosis): tooth pain" } });
    const others = await db.aiConversation.create({ data: { patientId: w.patientB.id, summary: "Patient-reported symptoms (not a confirmed diagnosis): someone else's" } });

    const mine = await appointments.bookAppointment(w.patientA.user, { ...bookingInput(w, { date: futureDate(10), startTime: "09:00" }), aiConversationId: own.id });
    expect(mine.aiSummary).toContain("tooth pain");

    const stolen = await appointments.bookAppointment(w.patientA.user, { ...bookingInput(w, { date: futureDate(10), startTime: "09:30" }), aiConversationId: others.id });
    expect(stolen.aiSummary).toBeUndefined();
  });
});

describe("double-booking prevention", () => {
  it("rejects a second booking of the same slot", async () => {
    const date = futureDate(11);
    await appointments.bookAppointment(w.patientA.user, bookingInput(w, { date, startTime: "10:00" }));
    await expect(appointments.bookAppointment(w.patientB.user, bookingInput(w, { date, startTime: "10:00" }))).rejects.toBeInstanceOf(SlotUnavailableError);
  });

  it("never offers a taken slot in the availability listing", async () => {
    const date = futureDate(12);
    await appointments.bookAppointment(w.patientA.user, bookingInput(w, { date, startTime: "10:30" }));
    const doctor = (await (await import("@/services/catalog")).getDoctor(w.doctor.id))!;
    const { slots } = await scheduling.getDoctorSlots(doctor, date);
    expect(slots.find((s) => s.startTime === "10:30")?.isBooked).toBe(true);
    expect(slots.find((s) => s.startTime === "11:00")?.isBooked).toBe(false);
  });

  it("lets two different doctors be booked at the same time", async () => {
    const date = futureDate(13);
    await appointments.bookAppointment(w.patientA.user, bookingInput(w, { date, startTime: "15:00" }));
    await expect(appointments.bookAppointment(w.patientB.user, bookingInput(w, { doctorId: w.otherDoctor.id, date, startTime: "15:00" }))).resolves.toBeTruthy();
  });

  it("guarantees exactly one winner when many patients race for the same slot", async () => {
    const date = futureDate(14);
    const racers = await Promise.all(Array.from({ length: 6 }, (_, i) => createPatient(db, `Racer ${i}`)));

    const results = await Promise.allSettled(racers.map((r) => appointments.bookAppointment(r.user, bookingInput(w, { date, startTime: "16:00" }))));

    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const losers = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
    expect(losers).toHaveLength(5);
    for (const loser of losers) expect(loser.reason).toBeInstanceOf(SlotUnavailableError);

    // …and the database agrees: one slot row, one live appointment.
    expect(await db.appointmentSlot.count({ where: { doctorId: w.doctor.id, date, startTime: "16:00" } })).toBe(1);
    expect(await db.appointment.count({ where: { doctorId: w.doctor.id, date, startTime: "16:00", status: { not: "CANCELLED" } } })).toBe(1);
  });

  it("is enforced by the database itself, not only by application code", async () => {
    const date = futureDate(15);
    const data = { doctorId: w.doctor.id, date, startTime: "09:00", endTime: "09:30" };
    await db.appointmentSlot.create({ data });
    await expect(db.appointmentSlot.create({ data })).rejects.toMatchObject({ code: "P2002" });
  });
});

describe("doctor availability is respected by the booking engine", () => {
  const book = (over: Parameters<typeof bookingInput>[1]) => appointments.bookAppointment(w.patientB.user, bookingInput(w, over));

  it("refuses times inside the doctor's break, outside working hours, off the grid, and in the past", async () => {
    const date = futureDate(16);
    await expect(book({ date, startTime: "12:00" })).rejects.toBeInstanceOf(SlotUnavailableError); // break 12–13
    await expect(book({ date, startTime: "08:00" })).rejects.toBeInstanceOf(SlotUnavailableError); // before opening
    await expect(book({ date, startTime: "17:00" })).rejects.toBeInstanceOf(SlotUnavailableError); // closing time
    await expect(book({ date, startTime: "09:15" })).rejects.toBeInstanceOf(SlotUnavailableError); // off the 30-min grid
    await expect(book({ date: addDays(clinicToday(), -1), startTime: "10:00" })).rejects.toBeInstanceOf(SlotUnavailableError);
  });

  it("refuses blocked dates, then leave, then temporary unavailability — and notifies affected patients", async () => {
    const affectedDate = futureDate(20);
    const booked = await appointments.bookAppointment(w.patientA.user, bookingInput(w, { date: affectedDate, startTime: "10:00" }));
    const before = (await notificationsFor(w.patientA.userId)).length;

    // Doctor blocks that date (holiday) — the existing appointment is flagged, not silently cancelled.
    const result = await scheduling.saveDoctorSchedule(w.doctor.id, { blockedDates: [{ date: affectedDate, kind: "HOLIDAY", reason: "Clinic holiday" }] }, w.doctor.userId);
    expect(result.affectedAppointments).toBe(1);
    expect((await appointments.getAppointmentForUser(w.patientA.user, booked.id)).status).toBe("CONFIRMED");
    const after = await notificationsFor(w.patientA.userId);
    expect(after.length).toBe(before + 1);
    expect(after.at(-1)).toMatchObject({ type: "DOCTOR_AVAILABILITY" });

    await expect(book({ date: affectedDate, startTime: "11:00" })).rejects.toBeInstanceOf(SlotUnavailableError);

    // Leave on another day.
    const leaveDate = futureDate(21);
    await scheduling.saveDoctorSchedule(w.doctor.id, { blockedDates: [{ date: affectedDate, kind: "HOLIDAY" }, { date: leaveDate, kind: "LEAVE", reason: "Conference" }] }, w.doctor.userId);
    await expect(book({ date: leaveDate, startTime: "11:00" })).rejects.toBeInstanceOf(SlotUnavailableError);

    // Temporary unavailability blocks everything…
    await scheduling.saveDoctorSchedule(w.doctor.id, { isTemporarilyUnavailable: true, unavailableReason: "Out sick" }, w.doctor.userId);
    await expect(book({ date: futureDate(22), startTime: "11:00" })).rejects.toBeInstanceOf(SlotUnavailableError);

    // …and lifting it restores booking.
    await scheduling.saveDoctorSchedule(w.doctor.id, { isTemporarilyUnavailable: false }, w.doctor.userId);
    await expect(book({ date: futureDate(22), startTime: "11:00" })).resolves.toBeTruthy();
  });

  it("explains an unavailable day and proposes the next available dates", async () => {
    const closed = futureDate(30);
    await scheduling.saveDoctorSchedule(w.otherDoctor.id, { blockedDates: [{ date: closed, kind: "LEAVE" }] }, w.otherDoctor.userId);
    const doctor = (await (await import("@/services/catalog")).getDoctor(w.otherDoctor.id))!;

    const day = await scheduling.getDoctorSlots(doctor, closed);
    expect(day.slots).toEqual([]);
    expect(day.unavailable?.reason).toBe("BLOCKED_DATE");
    expect(day.unavailable?.message).toMatch(/^Dr\. Beta is unavailable on .*\.$/);
    expect(day.alternatives.length).toBeGreaterThan(0);
    expect(day.alternatives.every((a) => a.date > closed)).toBe(true); // proposes later dates, never the blocked one
    expect(day.alternatives.some((a) => a.date === closed)).toBe(false);
  });

  it("supports changing working days and hours", async () => {
    const doctor = await (await import("@/test/fixtures")).createDoctor(db, w.specialtyId, { name: "Dr. Hours" });
    const date = futureDate(24);
    await scheduling.saveDoctorSchedule(
      doctor.id,
      { availability: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({ dayOfWeek, isActive: true, startTime: "14:00", endTime: "16:00" })) },
      doctor.userId
    );
    const fresh = (await (await import("@/services/catalog")).getDoctor(doctor.id))!;
    const { slots } = await scheduling.getDoctorSlots(fresh, date);
    expect(slots.map((s) => s.startTime)).toEqual(["14:00", "14:30", "15:00", "15:30"]);
    await expect(appointments.bookAppointment(w.patientA.user, bookingInput(w, { doctorId: doctor.id, date, startTime: "09:00" }))).rejects.toBeInstanceOf(SlotUnavailableError);
  });
});

describe("cancellation", () => {
  it("frees the slot, voids the payment and notifies both sides", async () => {
    const date = futureDate(40);
    const appt = await appointments.bookAppointment(w.patientA.user, bookingInput(w, { date, startTime: "09:00" }));

    const cancelled = await appointments.applyAppointmentAction(w.patientA.user, appt.id, { action: "cancel", reason: "Change of plans" });
    expect(cancelled.status).toBe("CANCELLED");
    expect(await db.appointmentSlot.count({ where: { doctorId: w.doctor.id, date, startTime: "09:00" } })).toBe(0);
    expect((await db.payment.findUnique({ where: { appointmentId: appt.id } }))?.status).toBe("CANCELLED");
    expect((await notificationsFor(w.patientA.userId)).some((n) => n.type === "APPOINTMENT_CANCELLED")).toBe(true);
    expect((await notificationsFor(w.doctor.userId)).some((n) => n.type === "APPOINTMENT_CANCELLED" && n.message.includes("Change of plans"))).toBe(true);

    // The freed slot can be booked again by someone else.
    await expect(appointments.bookAppointment(w.patientB.user, bookingInput(w, { date, startTime: "09:00" }))).resolves.toBeTruthy();
  });

  it("refunds a payment that was already made", async () => {
    const appt = await appointments.bookAppointment(w.patientA.user, bookingInput(w, { date: futureDate(41), startTime: "09:00" }));
    const payments = await import("@/services/payments");
    const payment = await db.payment.findUniqueOrThrow({ where: { appointmentId: appt.id } });
    await payments.payForAppointment(w.patientA.user, payment.id);

    await appointments.applyAppointmentAction(w.patientA.user, appt.id, { action: "cancel" });
    expect((await db.payment.findUnique({ where: { id: payment.id } }))?.status).toBe("REFUNDED");
  });

  it("cannot cancel an appointment twice, or one that is completed", async () => {
    const appt = await appointments.bookAppointment(w.patientA.user, bookingInput(w, { date: futureDate(42), startTime: "09:00" }));
    await appointments.applyAppointmentAction(w.patientA.user, appt.id, { action: "cancel" });
    await expect(appointments.applyAppointmentAction(w.patientA.user, appt.id, { action: "cancel" })).rejects.toMatchObject({ code: "ACTION_NOT_ALLOWED" });

    const done = await db.appointment.create({
      data: { patientId: w.patientA.id, doctorId: w.doctor.id, serviceId: w.serviceId, date: addDays(clinicToday(), -5), startTime: "10:00", endTime: "10:30", status: "COMPLETED", patientName: "Alice" },
    });
    await expect(appointments.applyAppointmentAction(w.patientA.user, done.id, { action: "cancel" })).rejects.toMatchObject({ code: "ACTION_NOT_ALLOWED" });
  });

  it("does not let one patient cancel another patient's appointment", async () => {
    const appt = await appointments.bookAppointment(w.patientA.user, bookingInput(w, { date: futureDate(43), startTime: "09:00" }));
    await expect(appointments.applyAppointmentAction(w.patientB.user, appt.id, { action: "cancel" })).rejects.toMatchObject({ status: 403 });
    expect((await appointments.getAppointmentForUser(w.patientA.user, appt.id)).status).toBe("CONFIRMED");
  });

  it("notifies the patient when the doctor cancels", async () => {
    const appt = await appointments.bookAppointment(w.patientB.user, bookingInput(w, { date: futureDate(44), startTime: "09:00" }));
    const before = (await notificationsFor(w.patientB.userId)).length;
    await appointments.applyAppointmentAction(w.doctor.user, appt.id, { action: "cancel" });
    expect((await notificationsFor(w.patientB.userId)).length).toBe(before + 1);
  });
});

describe("rescheduling", () => {
  it("moves the appointment, frees the old slot, claims the new one and notifies", async () => {
    const oldDate = futureDate(50);
    const newDate = futureDate(51);
    const appt = await appointments.bookAppointment(w.patientA.user, bookingInput(w, { date: oldDate, startTime: "09:00" }));

    const moved = await appointments.applyAppointmentAction(w.patientA.user, appt.id, { action: "reschedule", date: newDate, startTime: "13:30" });
    expect(moved).toMatchObject({ date: newDate, startTime: "13:30", endTime: "14:00", status: "RESCHEDULED" });

    expect(await db.appointmentSlot.count({ where: { doctorId: w.doctor.id, date: oldDate, startTime: "09:00" } })).toBe(0);
    expect(await db.appointmentSlot.count({ where: { doctorId: w.doctor.id, date: newDate, startTime: "13:30" } })).toBe(1);
    expect((await notificationsFor(w.patientA.userId)).some((n) => n.type === "APPOINTMENT_RESCHEDULED")).toBe(true);
    expect((await notificationsFor(w.doctor.userId)).some((n) => n.type === "APPOINTMENT_RESCHEDULED")).toBe(true);

    // Old slot is bookable again.
    await expect(appointments.bookAppointment(w.patientB.user, bookingInput(w, { date: oldDate, startTime: "09:00" }))).resolves.toBeTruthy();
  });

  it("refuses to reschedule into a taken slot, an unavailable time, or the same time", async () => {
    const date = futureDate(52);
    const taken = await appointments.bookAppointment(w.patientB.user, bookingInput(w, { date, startTime: "10:00" }));
    const mine = await appointments.bookAppointment(w.patientA.user, bookingInput(w, { date, startTime: "11:00" }));

    await expect(appointments.applyAppointmentAction(w.patientA.user, mine.id, { action: "reschedule", date, startTime: "10:00" })).rejects.toBeInstanceOf(SlotUnavailableError);
    await expect(appointments.applyAppointmentAction(w.patientA.user, mine.id, { action: "reschedule", date, startTime: "12:00" })).rejects.toBeInstanceOf(SlotUnavailableError); // break
    await expect(appointments.applyAppointmentAction(w.patientA.user, mine.id, { action: "reschedule", date, startTime: "11:00" })).rejects.toMatchObject({ status: 400 }); // same

    // Nothing changed.
    const after = await appointments.getAppointmentForUser(w.patientA.user, mine.id);
    expect(after).toMatchObject({ date, startTime: "11:00", status: "CONFIRMED" });
    expect(taken.startTime).toBe("10:00");
  });

  it("cannot reschedule a cancelled or already-started appointment", async () => {
    const appt = await appointments.bookAppointment(w.patientA.user, bookingInput(w, { date: futureDate(53), startTime: "09:00" }));
    await appointments.applyAppointmentAction(w.patientA.user, appt.id, { action: "cancel" });
    await expect(appointments.applyAppointmentAction(w.patientA.user, appt.id, { action: "reschedule", date: futureDate(54), startTime: "09:00" })).rejects.toMatchObject({ code: "ACTION_NOT_ALLOWED" });

    const past = await db.appointment.create({
      data: { patientId: w.patientA.id, doctorId: w.doctor.id, serviceId: w.serviceId, date: addDays(clinicToday(), -2), startTime: "10:00", endTime: "10:30", status: "CONFIRMED", patientName: "Alice" },
    });
    await expect(appointments.applyAppointmentAction(w.patientA.user, past.id, { action: "reschedule", date: futureDate(54), startTime: "10:00" })).rejects.toMatchObject({ code: "ACTION_NOT_ALLOWED" });
  });

  it("lets the doctor reschedule, notifying only the patient", async () => {
    const appt = await appointments.bookAppointment(w.patientB.user, bookingInput(w, { date: futureDate(55), startTime: "09:00" }));
    const doctorBefore = (await notificationsFor(w.doctor.userId)).length;
    const patientBefore = (await notificationsFor(w.patientB.userId)).length;

    const moved = await appointments.applyAppointmentAction(w.doctor.user, appt.id, { action: "reschedule", date: futureDate(56), startTime: "15:00" });
    expect(moved.startTime).toBe("15:00");
    expect((await notificationsFor(w.patientB.userId)).length).toBe(patientBefore + 1);
    expect((await notificationsFor(w.doctor.userId)).length).toBe(doctorBefore); // the doctor did it themselves
  });

  it("keeps a PENDING request pending when it is rescheduled", async () => {
    const strict = await (await import("@/test/fixtures")).createDoctor(db, w.specialtyId, { autoConfirm: false });
    const appt = await appointments.bookAppointment(w.patientA.user, bookingInput(w, { doctorId: strict.id, date: futureDate(57), startTime: "09:00" }));
    const moved = await appointments.applyAppointmentAction(w.patientA.user, appt.id, { action: "reschedule", date: futureDate(58), startTime: "09:00" });
    expect(moved.status).toBe("PENDING");
  });
});

describe("doctor lifecycle actions", () => {
  it("completes a visit with notes, marks no-shows, and lets notes be edited afterwards", async () => {
    const today = clinicToday();
    const visit = await db.appointment.create({
      data: { patientId: w.patientA.id, doctorId: w.doctor.id, serviceId: w.serviceId, date: today, startTime: "09:00", endTime: "09:30", status: "CONFIRMED", patientName: "Alice" },
    });
    const done = await appointments.applyAppointmentAction(w.doctor.user, visit.id, { action: "complete", doctorNotes: "Routine check, no concerns." });
    expect(done).toMatchObject({ status: "COMPLETED", doctorNotes: "Routine check, no concerns." });

    const noted = await appointments.applyAppointmentAction(w.doctor.user, visit.id, { action: "note", doctorNotes: "Addendum: review in 6 months." });
    expect(noted.doctorNotes).toBe("Addendum: review in 6 months.");

    const missed = await db.appointment.create({
      data: { patientId: w.patientB.id, doctorId: w.doctor.id, serviceId: w.serviceId, date: addDays(today, -1), startTime: "10:00", endTime: "10:30", status: "CONFIRMED", patientName: "Bob" },
    });
    expect((await appointments.applyAppointmentAction(w.doctor.user, missed.id, { action: "no_show" })).status).toBe("NO_SHOW");
  });

  it("will not complete a future appointment", async () => {
    const appt = await appointments.bookAppointment(w.patientA.user, bookingInput(w, { date: futureDate(60), startTime: "09:00" }));
    await expect(appointments.applyAppointmentAction(w.doctor.user, appt.id, { action: "complete", doctorNotes: "x" })).rejects.toMatchObject({ code: "ACTION_NOT_ALLOWED" });
  });
});

describe("reminders", () => {
  it("sends one reminder per appointment starting within 24 hours, and never twice", async () => {
    const strict = await (await import("@/test/fixtures")).createDoctor(db, w.specialtyId, { name: "Dr. Reminder" });
    const patient = await createPatient(db, "Remind Me");
    // Book for tomorrow at 23:30 wouldn't fit hours; use the database directly for a controlled start time.
    const tomorrow = addDays(clinicToday(), 1);
    await db.appointment.create({
      data: { patientId: patient.id, doctorId: strict.id, serviceId: w.serviceId, date: tomorrow, startTime: "00:05", endTime: "00:35", status: "CONFIRMED", patientName: "Remind Me" },
    });
    const far = addDays(clinicToday(), 10);
    await db.appointment.create({
      data: { patientId: patient.id, doctorId: strict.id, serviceId: w.serviceId, date: far, startTime: "09:00", endTime: "09:30", status: "CONFIRMED", patientName: "Remind Me" },
    });

    const sent = await appointments.sendDueReminders(48);
    expect(sent).toBeGreaterThanOrEqual(1);
    const reminders = (await notificationsFor(patient.userId)).filter((n) => n.type === "APPOINTMENT_REMINDER");
    expect(reminders).toHaveLength(1); // the far-future appointment is not reminded yet

    await appointments.sendDueReminders(48);
    expect((await notificationsFor(patient.userId)).filter((n) => n.type === "APPOINTMENT_REMINDER")).toHaveLength(1);
  });
});
