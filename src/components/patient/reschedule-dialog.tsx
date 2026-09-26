"use client";

import { useState } from "react";
import { ApiError, apiFetch } from "@/lib/api-client";
import { useAsyncAction } from "@/hooks/use-async-action";
import { formatLongDate, formatTime12 } from "@/lib/time";
import type { Appointment } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InlineAlert } from "@/components/shared/states";
import { SlotPicker, type SlotSelection } from "@/components/shared/slot-picker";

export function RescheduleDialog({
  appointment,
  open,
  onOpenChange,
  onDone,
}: {
  appointment: Appointment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: (message: string) => void;
}) {
  const [selection, setSelection] = useState<SlotSelection | null>(null);
  // Bumping the key remounts the picker so it re-reads availability after a conflict.
  const [pickerKey, setPickerKey] = useState(0);

  function refreshPicker() {
    setSelection(null);
    setPickerKey((k) => k + 1);
  }

  const { run, pending, error, rawError, reset } = useAsyncAction(async (slot: SlotSelection) => {
    try {
      await apiFetch(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        json: { action: "reschedule", date: slot.date, startTime: slot.startTime },
      });
    } catch (err) {
      // Someone else took the slot: re-read availability so the picker reflects reality.
      if (err instanceof ApiError && err.code === "SLOT_UNAVAILABLE") refreshPicker();
      throw err;
    }
    return slot;
  });

  const conflict = rawError instanceof ApiError && rawError.code === "SLOT_UNAVAILABLE";

  function handleOpenChange(next: boolean) {
    if (pending) return;
    if (!next) {
      setSelection(null);
      reset();
    }
    onOpenChange(next);
  }

  async function confirm() {
    if (!selection) return;
    const done = await run(selection);
    if (done) {
      setSelection(null);
      onOpenChange(false);
      onDone(`Your appointment was moved to ${formatLongDate(done.date)} at ${formatTime12(done.startTime)}.`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reschedule appointment</DialogTitle>
          <DialogDescription>
            {appointment.serviceName} with {appointment.doctorName}. Currently {formatLongDate(appointment.date)} at{" "}
            {formatTime12(appointment.startTime)}.
          </DialogDescription>
        </DialogHeader>

        <SlotPicker
          key={pickerKey}
          doctorId={appointment.doctorId}
          value={selection}
          onChange={(next) => {
            setSelection(next);
            if (error) reset();
          }}
        />

        {error && (
          <div className="mt-4">
            <InlineAlert variant="error" title={conflict ? "That time was just taken" : undefined}>
              {error}
              {conflict && " The available times below have been refreshed."}
            </InlineAlert>
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={pending}>
            Close
          </Button>
          <Button onClick={confirm} disabled={!selection || pending}>
            {pending ? "Rescheduling…" : "Confirm new time"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
