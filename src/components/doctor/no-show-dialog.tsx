"use client";

import type { Appointment } from "@/types";
import { formatLongDate, formatTime12 } from "@/lib/time";
import { ActionDialog } from "@/components/doctor/action-dialog";
import { useAppointmentAction } from "@/components/doctor/use-appointment-action";

export function NoShowDialog({ appointment, onClose }: { appointment: Appointment; onClose: () => void }) {
  const { perform, pending, error } = useAppointmentAction(appointment.id, onClose);

  return (
    <ActionDialog
      open
      onOpenChange={(o) => !o && onClose()}
      title="Mark as no-show?"
      description={`Record that ${appointment.patientName} did not attend the appointment on ${formatLongDate(appointment.date)} at ${formatTime12(appointment.startTime)}.`}
      submitLabel="Mark no-show"
      pending={pending}
      error={error}
      destructive
      onSubmit={() => perform({ action: "no_show" })}
    />
  );
}
