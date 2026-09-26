"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { useAsyncAction } from "@/hooks/use-async-action";
import { formatLongDate, formatTime12 } from "@/lib/time";
import type { Appointment } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InlineAlert } from "@/components/shared/states";

const MAX_REASON = 300;

export function CancelDialog({
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
  const [reason, setReason] = useState("");
  const { run, pending, error, reset } = useAsyncAction(async () => {
    await apiFetch(`/api/appointments/${appointment.id}`, {
      method: "PATCH",
      json: { action: "cancel", reason: reason.trim() || undefined },
    });
    return true;
  });

  function handleOpenChange(next: boolean) {
    if (pending) return;
    if (!next) {
      setReason("");
      reset();
    }
    onOpenChange(next);
  }

  async function confirm() {
    const ok = await run();
    if (!ok) return;
    setReason("");
    reset();
    onOpenChange(false);
    onDone(`Your appointment with ${appointment.doctorName} on ${formatLongDate(appointment.date)} was cancelled.`);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)]">
        <DialogHeader>
          <DialogTitle>Cancel this appointment?</DialogTitle>
          <DialogDescription>
            {appointment.serviceName} with {appointment.doctorName} on {formatLongDate(appointment.date)} at{" "}
            {formatTime12(appointment.startTime)}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-navy">
            The time slot will be released for other patients. If you already paid the consultation fee, it is refunded automatically.
          </p>
          <div>
            <Label htmlFor={`cancel-reason-${appointment.id}`}>Reason (optional)</Label>
            <Textarea
              id={`cancel-reason-${appointment.id}`}
              value={reason}
              maxLength={MAX_REASON}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Let your doctor know why you are cancelling"
              className="mt-1.5"
              aria-describedby={`cancel-count-${appointment.id}`}
            />
            <p id={`cancel-count-${appointment.id}`} className="mt-1 text-right text-xs text-muted">
              {reason.length}/{MAX_REASON}
            </p>
          </div>
          {error && <InlineAlert variant="error">{error}</InlineAlert>}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={pending}>
            Keep appointment
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={pending}>
            {pending ? "Cancelling…" : "Cancel appointment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
