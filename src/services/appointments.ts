import { db, Prisma } from "@/database/client";
import { ACTIVE_STATUSES, allowedActions, isActiveStatus } from "@/lib/appointment-rules";
import { findOpenSlot } from "@/lib/availability";
import { ConflictError, ForbiddenError, NotFoundError, SlotUnavailableError, ValidationError } from "@/lib/errors";
import type { SessionUser } from "@/lib/guards";
import { clinicNow, formatLongDate, formatTime12, timeToMinutes } from "@/lib/time";
import type { AppointmentAction, BookingInput } from "@/lib/validation";
import type { Appointment } from "@/types";
import { audit } from "@/services/audit";
import { appointmentInclude, doctorInclude, toAppointment, toDoctor } from "@/services/mappers";
import { notifyUser } from "@/services/notifications";

const actionInclude = {
  ...appointmentInclude,
  patient: { select: { userId: true } },
  doctor: { include: { user: { select: { id: true, name: true } }, specialty: { select: { name: true } } } },
} satisfies Prisma.AppointmentInclude;

function isUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

const describe = (date: string, startTime: string) => `${formatLongDate(date)} at ${formatTime12(startTime)}`;

// ---------------------------------------------------------------- reads

export async function listAppointmentsForPatient(patientId: string): Promise<Appointment[]> {
  const rows = await db.appointment.findMany({
    where: { patientId },
    include: appointmentInclude,
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
  return rows.map(toAppointment);
}

export async function listAppointmentsForDoctor(doctorId: string): Promise<Appointment[]> {
  const rows = await db.appointment.findMany({
    where: { doctorId },
    include: appointmentInclude,
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
  return rows.map(toAppointment);
}

export async function listAllAppointments(): Promise<Appointment[]> {
  const rows = await db.appointment.findMany({
    include: appointmentInclude,
    orderBy: [{ date: "desc" }, { startTime: "desc" }],
    take: 500,
  });
  return rows.map(toAppointment);
}

/** Role-scoped listing: a user only ever receives appointments they are entitled to see. */
export async function listAppointmentsForUser(user: SessionUser): Promise<Appointment[]> {
  if (user.role === "ADMIN") return listAllAppointments();
  if (user.role === "DOCTOR" && user.doctorId) return listAppointmentsForDoctor(user.doctorId);
  if (user.role === "PATIENT" && user.patientId) return listAppointmentsForPatient(user.patientId);
  return [];
}

export async function getAppointmentForUser(user: SessionUser, id: string): Promise<Appointment> {
  const row = await db.appointment.findUnique({ where: { id }, include: appointmentInclude });
  if (!row) throw new NotFoundError("Appointment not found.");
  assertCanAccess(user, row);
  return toAppointment(row);
}

function assertCanAccess(user: SessionUser, appt: { patientId: string; doctorId: string }) {
  const ok =
    user.role === "ADMIN" ||
    (user.role === "PATIENT" && user.patientId === appt.patientId) ||
    (user.role === "DOCTOR" && user.doctorId === appt.doctorId);
  if (!ok) throw new ForbiddenError("You do not have access to this appointment.");
}

// ---------------------------------------------------------------- booking

export async function bookAppointment(user: SessionUser, input: BookingInput, ip?: string): Promise<Appointment> {
  if (user.role !== "PATIENT" || !user.patientId) {
    throw new ForbiddenError("Sign in with a patient account to book an appointment.");
  }
  const patientId = user.patientId;

  try {
    const appointment = await db.$transaction(async (tx) => {
      const doctorRow = await tx.doctor.findUnique({ where: { id: input.doctorId }, include: doctorInclude });
      if (!doctorRow || !doctorRow.isActive) throw new NotFoundError("Doctor not found.");
      const service = await tx.service.findUnique({ where: { id: input.serviceId } });
      if (!service || !service.isActive) throw new NotFoundError("Service not found.");
      if (service.specialtyId !== doctorRow.specialtyId) {
        throw new ValidationError("This doctor does not offer the selected service.");
      }
      if (input.consultationType === "ONLINE" && !doctorRow.supportsOnline) {
        throw new ValidationError("This doctor does not offer online consultations.");
      }
      if (input.consultationType === "IN_PERSON" && !doctorRow.supportsInPerson) {
        throw new ValidationError("This doctor does not offer in-person consultations.");
      }

      // Re-validate the slot against the same engine that offered it, using the
      // slots claimed as of this transaction. The unique index below is the
      // hard guarantee if two patients race for the same slot.
      const doctor = toDoctor(doctorRow);
      const claimed = await tx.appointmentSlot.findMany({
        where: { doctorId: doctor.id, date: input.date },
        select: { startTime: true },
      });
      const slot = findOpenSlot(doctor, input.date, input.startTime, new Set(claimed.map((c) => c.startTime)));
      if (!slot) throw new SlotUnavailableError();

      // A patient cannot hold two active appointments at the same time.
      const overlapping = await tx.appointment.findFirst({
        where: { patientId, date: input.date, startTime: slot.startTime, status: { in: [...ACTIVE_STATUSES] } },
      });
      if (overlapping) {
        throw new ConflictError("You already have an appointment at this time.", "PATIENT_DOUBLE_BOOKED");
      }

      // Only a conversation this patient owns may be attached; its summary is
      // copied server-side rather than trusted from the client.
      let aiSummary: string | undefined;
      let aiConversationId: string | undefined;
      if (input.aiConversationId) {
        const conv = await tx.aiConversation.findUnique({ where: { id: input.aiConversationId } });
        if (conv && conv.patientId === patientId) {
          aiConversationId = conv.id;
          aiSummary = conv.summary ?? undefined;
        }
      }

      const slotRow = await tx.appointmentSlot.create({
        data: { doctorId: doctor.id, date: slot.date, startTime: slot.startTime, endTime: slot.endTime },
      });

      const created = await tx.appointment.create({
        data: {
          patientId,
          doctorId: doctor.id,
          serviceId: service.id,
          slotId: slotRow.id,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          consultationType: input.consultationType,
          status: doctor.autoConfirm ? "CONFIRMED" : "PENDING",
          patientName: input.patientName,
          notes: input.notes,
          aiSummary,
          aiConversationId,
          payment: {
            create: { patientId, amount: doctor.consultationFee, currency: "USD", status: "PENDING", provider: "demo" },
          },
        },
        include: actionInclude,
      });

      const finalAppt = input.consultationType === "ONLINE"
        ? await tx.appointment.update({
            where: { id: created.id },
            data: { meetingUrl: `/consultation/${created.id}` },
            include: actionInclude,
          })
        : created;

      const when = describe(slot.date, slot.startTime);
      if (doctor.autoConfirm) {
        await notifyUser(user.id, "APPOINTMENT_CONFIRMED", "Appointment confirmed", `Your appointment with ${doctor.name} on ${when} is confirmed.`, tx);
      } else {
        await notifyUser(user.id, "GENERAL", "Booking received", `Your request for ${doctor.name} on ${when} was received. You'll be notified once the doctor confirms.`, tx);
      }
      await notifyUser(
        doctorRow.userId,
        "GENERAL",
        doctor.autoConfirm ? "New appointment booked" : "New appointment request",
        `${input.patientName} booked ${service.name} on ${when}.`,
        tx
      );
      await audit(
        { userId: user.id, action: "APPOINTMENT_BOOKED", entityType: "Appointment", entityId: created.id, ipAddress: ip },
        tx
      );
      return finalAppt;
    });
    return toAppointment(appointment);
  } catch (err) {
    if (isUniqueViolation(err)) throw new SlotUnavailableError();
    throw err;
  }
}

// ---------------------------------------------------------------- lifecycle

export async function applyAppointmentAction(
  user: SessionUser,
  id: string,
  action: AppointmentAction,
  ip?: string
): Promise<Appointment> {
  const existing = await db.appointment.findUnique({ where: { id }, include: actionInclude });
  if (!existing) throw new NotFoundError("Appointment not found.");
  assertCanAccess(user, existing);

  const now = clinicNow();
  if (!allowedActions(existing, user.role, now).includes(action.action)) {
    throw new ConflictError(
      `This appointment is ${existing.status.toLowerCase().replace("_", " ")} and cannot be changed that way.`,
      "ACTION_NOT_ALLOWED"
    );
  }

  const doctorName = existing.doctor.user.name;
  const doctorUserId = existing.doctor.user.id;
  const patientUserId = existing.patient.userId;
  const actorIsDoctor = user.role === "DOCTOR";

  try {
    const updated = await db.$transaction(async (tx) => {
      let result;
      switch (action.action) {
        case "accept": {
          result = await tx.appointment.update({ where: { id }, data: { status: "CONFIRMED" }, include: actionInclude });
          await notifyUser(patientUserId, "APPOINTMENT_CONFIRMED", "Appointment confirmed", `${doctorName} confirmed your appointment on ${describe(existing.date, existing.startTime)}.`, tx);
          break;
        }
        case "complete": {
          result = await tx.appointment.update({
            where: { id },
            data: { status: "COMPLETED", ...(action.doctorNotes ? { doctorNotes: action.doctorNotes } : {}) },
            include: actionInclude,
          });
          break;
        }
        case "no_show": {
          result = await tx.appointment.update({ where: { id }, data: { status: "NO_SHOW" }, include: actionInclude });
          break;
        }
        case "note": {
          result = await tx.appointment.update({ where: { id }, data: { doctorNotes: action.doctorNotes }, include: actionInclude });
          break;
        }
        case "cancel": {
          // Free the slot, refund/void the payment, tell the other party.
          result = await tx.appointment.update({
            where: { id },
            data: { status: "CANCELLED", slotId: null },
            include: actionInclude,
          });
          if (existing.slotId) await tx.appointmentSlot.delete({ where: { id: existing.slotId } });
          const payment = await tx.payment.findUnique({ where: { appointmentId: id } });
          if (payment?.status === "PAID") await tx.payment.update({ where: { id: payment.id }, data: { status: "REFUNDED" } });
          else if (payment?.status === "PENDING") await tx.payment.update({ where: { id: payment.id }, data: { status: "CANCELLED" } });

          const when = describe(existing.date, existing.startTime);
          await notifyUser(patientUserId, "APPOINTMENT_CANCELLED", "Appointment cancelled", `Your appointment with ${doctorName} on ${when} has been cancelled.${payment?.status === "PAID" ? " Your payment will be refunded." : ""}`, tx);
          if (!actorIsDoctor) {
            await notifyUser(doctorUserId, "APPOINTMENT_CANCELLED", "Appointment cancelled", `${existing.patientName}'s appointment on ${when} was cancelled${action.reason ? `: ${action.reason}` : "."}`, tx);
          }
          break;
        }
        case "reschedule": {
          const doctor = toDoctor(await tx.doctor.findUniqueOrThrow({ where: { id: existing.doctorId }, include: doctorInclude }));
          if (action.date === existing.date && action.startTime === existing.startTime) {
            throw new ValidationError("Choose a different time from your current appointment.");
          }
          const claimed = await tx.appointmentSlot.findMany({
            where: { doctorId: doctor.id, date: action.date },
            select: { startTime: true },
          });
          const slot = findOpenSlot(doctor, action.date, action.startTime, new Set(claimed.map((c) => c.startTime)), now);
          if (!slot) throw new SlotUnavailableError();

          const newSlot = await tx.appointmentSlot.create({
            data: { doctorId: doctor.id, date: slot.date, startTime: slot.startTime, endTime: slot.endTime },
          });
          result = await tx.appointment.update({
            where: { id },
            data: {
              slotId: newSlot.id,
              date: slot.date,
              startTime: slot.startTime,
              endTime: slot.endTime,
              status: existing.status === "PENDING" ? "PENDING" : "RESCHEDULED",
              reminderSentAt: null,
            },
            include: actionInclude,
          });
          if (existing.slotId) await tx.appointmentSlot.delete({ where: { id: existing.slotId } });

          const when = describe(slot.date, slot.startTime);
          await notifyUser(patientUserId, "APPOINTMENT_RESCHEDULED", "Appointment rescheduled", `Your appointment with ${doctorName} has been moved to ${when}.`, tx);
          if (!actorIsDoctor) {
            await notifyUser(doctorUserId, "APPOINTMENT_RESCHEDULED", "Appointment rescheduled", `${existing.patientName}'s appointment moved to ${when}.`, tx);
          }
          break;
        }
      }
      await audit(
        {
          userId: user.id,
          action: `APPOINTMENT_${action.action.toUpperCase()}`,
          entityType: "Appointment",
          entityId: id,
          ipAddress: ip,
        },
        tx
      );
      return result;
    });
    return toAppointment(updated);
  } catch (err) {
    if (isUniqueViolation(err)) throw new SlotUnavailableError();
    throw err;
  }
}

// ---------------------------------------------------------------- reminders

/**
 * Sends a reminder for every active appointment that starts within the next
 * `hoursAhead` hours and has not been reminded yet. Called by the cron
 * endpoint and by the admin "send due reminders" action.
 */
export async function sendDueReminders(hoursAhead = 24): Promise<number> {
  const now = clinicNow();
  const horizon = clinicNow(new Date(Date.now() + hoursAhead * 3_600_000));

  // Within the window: not yet started, and not beyond the horizon on its last day.
  const inWindow = (date: string, startTime: string) => {
    const minutes = timeToMinutes(startTime);
    if (date === now.dateISO && minutes <= now.minutes) return false;
    if (date === horizon.dateISO && minutes > horizon.minutes) return false;
    return true;
  };

  const candidates = await db.appointment.findMany({
    where: {
      status: { in: ["CONFIRMED", "RESCHEDULED"] },
      reminderSentAt: null,
      date: { gte: now.dateISO, lte: horizon.dateISO },
    },
    include: actionInclude,
  });

  let sent = 0;
  for (const appt of candidates.filter((a) => inWindow(a.date, a.startTime))) {
    await notifyUser(
      appt.patient.userId,
      "APPOINTMENT_REMINDER",
      "Appointment reminder",
      `Reminder: you have an appointment with ${appt.doctor.user.name} on ${describe(appt.date, appt.startTime)}.`
    );
    await db.appointment.update({ where: { id: appt.id }, data: { reminderSentAt: new Date() } });
    sent += 1;
  }
  return sent;
}

export { isActiveStatus };
