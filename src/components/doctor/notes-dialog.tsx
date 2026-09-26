"use client";

import { useState } from "react";
import type { Appointment } from "@/types";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ActionDialog } from "@/components/doctor/action-dialog";
import { useAppointmentAction } from "@/components/doctor/use-appointment-action";

export function NotesDialog({ appointment, onClose }: { appointment: Appointment; onClose: () => void }) {
  const [notes, setNotes] = useState(appointment.doctorNotes ?? "");
  const { perform, pending, error } = useAppointmentAction(appointment.id, onClose);
  const empty = notes.trim().length === 0;

  return (
    <ActionDialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={appointment.doctorNotes ? "Edit notes" : "Add notes"}
      description={`Private clinical notes for ${appointment.patientName}'s appointment. Patients do not see these.`}
      submitLabel="Save notes"
      pending={pending}
      error={error}
      onSubmit={() => perform({ action: "note", doctorNotes: notes.trim() })}
      submitDisabled={empty}
    >
      <div className="space-y-1.5">
        <Label htmlFor={`notes-${appointment.id}`}>Notes</Label>
        <Textarea
          id={`notes-${appointment.id}`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={4000}
          rows={6}
        />
        <p className="text-xs text-slate-600">{notes.length}/4000</p>
      </div>
    </ActionDialog>
  );
}
