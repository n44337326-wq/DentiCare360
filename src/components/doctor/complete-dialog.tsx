"use client";

import { useState } from "react";
import type { Appointment } from "@/types";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ActionDialog } from "@/components/doctor/action-dialog";
import { useAppointmentAction } from "@/components/doctor/use-appointment-action";

/** Marks a visit completed, with optional clinical notes (visible to the treating doctor and admins). */
export function CompleteDialog({ appointment, onClose }: { appointment: Appointment; onClose: () => void }) {
  const [notes, setNotes] = useState(appointment.doctorNotes ?? "");
  const { perform, pending, error } = useAppointmentAction(appointment.id, onClose);

  return (
    <ActionDialog
      open
      onOpenChange={(o) => !o && onClose()}
      title="Mark as completed"
      description={`Record that the visit with ${appointment.patientName} took place. You can add notes for the record.`}
      submitLabel="Mark completed"
      pendingLabel="Saving…"
      pending={pending}
      error={error}
      onSubmit={() => perform({ action: "complete", doctorNotes: notes.trim() || undefined })}
    >
      <div className="space-y-1.5">
        <Label htmlFor={`complete-notes-${appointment.id}`}>Visit notes (optional)</Label>
        <Textarea
          id={`complete-notes-${appointment.id}`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={4000}
          rows={5}
          placeholder="Findings, treatment given, follow-up advice…"
        />
        <p className="text-xs text-slate-600">{notes.length}/4000</p>
      </div>
    </ActionDialog>
  );
}
