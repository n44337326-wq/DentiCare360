"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api-client";
import type { Appointment } from "@/types";
import { formatLongDate, formatTime12 } from "@/lib/time";
import { SlotPicker, type SlotSelection } from "@/components/shared/slot-picker";
import { ActionDialog } from "@/components/doctor/action-dialog";
import { useAppointmentAction } from "@/components/doctor/use-appointment-action";

/** Moves an appointment to another open slot of the SAME doctor. The patient is notified. */
export function RescheduleDialog({ appointment, onClose }: { appointment: Appointment; onClose: () => void }) {
  const [selection, setSelection] = useState<SlotSelection | null>(null);
  const [pickerKey, setPickerKey] = useState(0);
  const { perform, pending, error, rawError } = useAppointmentAction(appointment.id, onClose);

  // A 409 means the slot was taken meanwhile: clear the choice and reload the slots.
  async function submit() {
    if (!selection) return;
    const ok = await perform({ action: "reschedule", date: selection.date, startTime: selection.startTime });
    if (!ok) {
      setSelection(null);
      setPickerKey((k) => k + 1);
    }
  }

  const conflict = rawError instanceof ApiError && rawError.status === 409;

  return (
    <ActionDialog
      open
      onOpenChange={(o) => !o && onClose()}
      title="Reschedule appointment"
      description={
        <>
          {appointment.patientName} · {appointment.serviceName}, currently {formatLongDate(appointment.date)} at{" "}
          {formatTime12(appointment.startTime)} with {appointment.doctorName}. The patient will be notified of the new time.
        </>
      }
      submitLabel="Confirm new time"
      pendingLabel="Rescheduling…"
      pending={pending}
      error={error ? (conflict ? `${error} The available times below were refreshed.` : error) : null}
      onSubmit={submit}
      submitDisabled={!selection}
      wide
    >
      <SlotPicker key={pickerKey} doctorId={appointment.doctorId} value={selection} onChange={setSelection} />
    </ActionDialog>
  );
}
