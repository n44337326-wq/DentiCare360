"use client";

import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppointmentAction } from "@/components/doctor/use-appointment-action";

/** Quick "Accept" for a pending booking request, with inline pending / error feedback. */
export function AcceptButton({ appointmentId }: { appointmentId: string }) {
  const { perform, pending, error } = useAppointmentAction(appointmentId);
  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" disabled={pending} onClick={() => perform({ action: "accept" })}>
        {pending ? <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Check aria-hidden="true" />}
        {pending ? "Accepting…" : "Accept"}
      </Button>
      {error && (
        <p role="alert" className="max-w-56 text-right text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
