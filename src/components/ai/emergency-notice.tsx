import { Clock3, Siren } from "lucide-react";
import { EMERGENCY_NOTICE } from "@/lib/ai-assistant";

/** Persistent, prominent notice shown above the conversation once an emergency was flagged. */
export function EmergencyNotice() {
  return (
    <div role="alert" className="flex gap-3 rounded-xl border-2 border-red-300 bg-red-50 p-4 text-red-900 animate-fade-in">
      <Siren className="mt-0.5 h-6 w-6 shrink-0 text-red-600" aria-hidden="true" />
      <div className="space-y-1 text-sm">
        <p className="text-base font-semibold">This may be a medical emergency — get help now</p>
        <p>
          {EMERGENCY_NOTICE} Don&apos;t wait for an appointment and don&apos;t rely on this chat. If someone is with you, ask them to stay with you.
        </p>
        <p className="text-red-800">Booking suggestions are turned off for this conversation.</p>
      </div>
    </div>
  );
}

/** Amber notice for urgent (same-day) presentations. */
export function UrgentNotice() {
  return (
    <div role="status" className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950 animate-fade-in">
      <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
      <div className="space-y-1 text-sm">
        <p className="font-semibold">Please be seen today</p>
        <p>
          What you&apos;ve described should be looked at by a clinician the same day. Book the earliest appointment below, and if things get
          worse or you have trouble breathing or swallowing, go to an emergency department.
        </p>
      </div>
    </div>
  );
}
