import { randomBytes } from "node:crypto";
import { db } from "@/database/client";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import type { SessionUser } from "@/lib/guards";
import type { PaymentItem } from "@/types";
import { audit } from "@/services/audit";
import { toPayment } from "@/services/mappers";

/**
 * Payment-provider integration point.
 *
 * A real provider (Stripe, Razorpay, …) plugs in by implementing this interface
 * and being returned from `getPaymentProvider()`. The contract is deliberately
 * card-data-free: the app only ever sees an opaque provider reference. Card
 * entry happens in the provider's hosted checkout / elements, never in our
 * forms, API or database. Secret keys come from environment variables and are
 * only ever read server-side.
 */
export interface PaymentProvider {
  readonly name: string;
  charge(input: { amountCents: number; currency: string; reference: string; description: string }): Promise<{
    ok: boolean;
    providerRef: string;
    failureReason?: string;
  }>;
  refund(providerRef: string): Promise<{ ok: boolean }>;
}

/** Demo provider: always succeeds, moves no money, receives no card data. */
export class DemoPaymentProvider implements PaymentProvider {
  readonly name = "demo";
  async charge() {
    return { ok: true, providerRef: `demo_txn_${randomBytes(6).toString("hex")}` };
  }
  async refund() {
    return { ok: true };
  }
}

export function getPaymentProvider(): PaymentProvider {
  // if (process.env.STRIPE_SECRET_KEY) return new StripePaymentProvider(process.env.STRIPE_SECRET_KEY);
  return new DemoPaymentProvider();
}

const paymentInclude = {
  invoice: true,
  appointment: { include: { service: { select: { name: true } }, doctor: { include: { user: { select: { name: true } } } } } },
} as const;

export async function listPaymentsForPatient(patientId: string): Promise<PaymentItem[]> {
  const rows = await db.payment.findMany({ where: { patientId }, include: paymentInclude, orderBy: { createdAt: "desc" } });
  return rows.map(toPayment);
}

export async function listAllPayments(): Promise<PaymentItem[]> {
  const rows = await db.payment.findMany({ include: paymentInclude, orderBy: { createdAt: "desc" }, take: 500 });
  return rows.map(toPayment);
}

/** Loads a payment and enforces that the viewer may see it (owner patient, the treating doctor, or admin). */
export async function getPaymentForViewer(user: SessionUser, paymentId: string) {
  const row = await db.payment.findUnique({
    where: { id: paymentId },
    include: {
      ...paymentInclude,
      patient: { include: { user: { select: { name: true, email: true } } } },
    },
  });
  if (!row) throw new NotFoundError("Payment not found.");

  const owner = user.role === "PATIENT" && user.patientId === row.patientId;
  const treatingDoctor = user.role === "DOCTOR" && user.doctorId === row.appointment.doctorId;
  if (!owner && !treatingDoctor && user.role !== "ADMIN") throw new ForbiddenError();
  return row;
}

/**
 * Settles a pending payment through the provider and issues the invoice.
 * Only the patient who owns the appointment can pay for it.
 */
export async function payForAppointment(user: SessionUser, paymentId: string, ip?: string): Promise<PaymentItem> {
  if (user.role !== "PATIENT" || !user.patientId) throw new ForbiddenError("Only patients can pay for an appointment.");

  const payment = await db.payment.findUnique({ where: { id: paymentId }, include: { appointment: true } });
  if (!payment || payment.patientId !== user.patientId) throw new NotFoundError("Payment not found.");
  if (payment.status === "PAID") throw new ConflictError("This payment has already been completed.", "ALREADY_PAID");
  if (payment.status !== "PENDING") throw new ConflictError("This payment can no longer be paid.", "NOT_PAYABLE");

  const provider = getPaymentProvider();
  const result = await provider.charge({
    amountCents: Math.round(Number(payment.amount) * 100),
    currency: payment.currency,
    reference: payment.id,
    description: `DentiCare360 consultation ${payment.appointmentId}`,
  });

  if (!result.ok) {
    await db.payment.update({ where: { id: payment.id }, data: { status: "FAILED", providerRef: result.providerRef } });
    await audit({ userId: user.id, action: "PAYMENT_FAILED", entityType: "Payment", entityId: payment.id, ipAddress: ip });
    throw new ConflictError(result.failureReason ?? "The payment could not be completed.", "PAYMENT_FAILED");
  }

  const invoiceNumber = `INV-${new Date().getFullYear()}-${randomBytes(3).toString("hex").toUpperCase()}`;
  const updated = await db.payment.update({
    where: { id: payment.id },
    data: {
      status: "PAID",
      provider: provider.name,
      providerRef: result.providerRef,
      invoice: { create: { invoiceNumber } },
    },
    include: paymentInclude,
  });
  await audit({
    userId: user.id,
    action: "PAYMENT_COMPLETED",
    entityType: "Payment",
    entityId: payment.id,
    metadata: { invoiceNumber },
    ipAddress: ip,
  });
  return toPayment(updated);
}
