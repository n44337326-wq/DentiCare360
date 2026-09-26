import { Badge } from "@/components/ui/badge";
import type { AppointmentStatus, PaymentStatus, UrgencyLevel } from "@/types";

type BadgeVariant = "default" | "success" | "warning" | "destructive" | "outline" | "cyan";

const APPOINTMENT: Record<AppointmentStatus, { label: string; variant: BadgeVariant }> = {
  PENDING: { label: "Awaiting confirmation", variant: "warning" },
  CONFIRMED: { label: "Confirmed", variant: "success" },
  RESCHEDULED: { label: "Rescheduled", variant: "cyan" },
  COMPLETED: { label: "Completed", variant: "default" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
  NO_SHOW: { label: "No-show", variant: "destructive" },
};

const PAYMENT: Record<PaymentStatus, { label: string; variant: BadgeVariant }> = {
  PENDING: { label: "Payment due", variant: "warning" },
  PAID: { label: "Paid", variant: "success" },
  FAILED: { label: "Failed", variant: "destructive" },
  REFUNDED: { label: "Refunded", variant: "default" },
  CANCELLED: { label: "Void", variant: "outline" },
};

const URGENCY: Record<UrgencyLevel, { label: string; variant: BadgeVariant }> = {
  LOW: { label: "Routine", variant: "success" },
  MODERATE: { label: "Moderate", variant: "warning" },
  HIGH: { label: "Urgent", variant: "warning" },
  EMERGENCY: { label: "Emergency flagged", variant: "destructive" },
};

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const { label, variant } = APPOINTMENT[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const { label, variant } = PAYMENT[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function UrgencyBadge({ urgency }: { urgency: UrgencyLevel }) {
  const { label, variant } = URGENCY[urgency];
  return <Badge variant={variant}>{label}</Badge>;
}
