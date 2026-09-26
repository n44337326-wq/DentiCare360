"use client";

import { useState } from "react";
import type { Appointment } from "@/types";
import { formatLongDate, formatTime12 } from "@/lib/time";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ActionDialog } from "@/components/doctor/action-dialog";
import { useAppointmentAction } from "@/components/doctor/use-appointment-action";

export function CancelDialog({ appointment, onClose }: { appointment: Appointment; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const { perform, pending, error } = useAppointmentAction(appointment.id, onClose);

  return (
    <ActionDialog
      open
      onOpenChange={(o) => !o && onClose()}
      title="Cancel this appointment?"
      description={`${appointment.patientName} · ${appointment.serviceName} on ${formatLongDate(appointment.date)} at ${formatTime12(appointment.startTime)}. The patient is notified, the time slot is released and any payment is refunded or voided.`}
      submitLabel="Cancel appointment"
      pendingLabel="Cancelling…"
      pending={pending}
      error={error}
      destructive
      onSubmit={() => perform({ action: "cancel", reason: reason.trim() || undefined })}
    >
      <div className="space-y-1.5">
        <Label htmlFor={`cancel-reason-${appointment.id}`}>Reason (optional)</Label>
        <Textarea
          id={`cancel-reason-${appointment.id}`}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={300}
          rows={3}
        />
      </div>
    </ActionDialog>
  );
}
