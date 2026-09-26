"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleCheck, Loader2, PauseCircle } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { useAsyncAction } from "@/hooks/use-async-action";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { InlineAlert } from "@/components/shared/states";
import { ActionDialog } from "@/components/doctor/action-dialog";

interface ScheduleResponse {
  affectedAppointments: number;
}

/**
 * One-click "Mark unavailable / Available again". Going unavailable asks for an
 * optional reason first because it notifies patients with upcoming visits.
 */
export function AvailabilityToggle({
  doctorId,
  isTemporarilyUnavailable,
}: {
  doctorId: string;
  isTemporarilyUnavailable: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [affected, setAffected] = useState<number | null>(null);

  const save = useCallback(
    async (unavailable: boolean) => {
      const res = await apiFetch<ScheduleResponse>(`/api/doctors/${doctorId}/schedule`, {
        method: "PUT",
        json: { isTemporarilyUnavailable: unavailable, unavailableReason: unavailable ? reason.trim() : "" },
      });
      setAffected(unavailable ? res.affectedAppointments : null);
      return true as const;
    },
    [doctorId, reason]
  );
  const { run, pending, error, succeeded } = useAsyncAction(save);

  async function toggle(unavailable: boolean) {
    if (await run(unavailable)) {
      setOpen(false);
      setReason("");
      router.refresh();
    }
  }

  return (
    <div className="space-y-3">
      {isTemporarilyUnavailable ? (
        <Button variant="secondary" size="sm" disabled={pending} onClick={() => toggle(false)}>
          {pending ? <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <CircleCheck aria-hidden="true" />}
          {pending ? "Updating…" : "Available again"}
        </Button>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <PauseCircle aria-hidden="true" /> Mark unavailable
        </Button>
      )}

      {!open && error && <InlineAlert variant="error">{error}</InlineAlert>}
      {!open && succeeded && !isTemporarilyUnavailable && affected === null && (
        <InlineAlert variant="success">You are available for bookings again.</InlineAlert>
      )}
      {!open && affected !== null && affected > 0 && (
        <InlineAlert variant="warning">
          {affected} upcoming appointment{affected === 1 ? " is" : "s are"} affected. Those patients were notified — please{" "}
          <Link href="/doctor/appointments" className="font-medium underline">
            reschedule them
          </Link>
          .
        </InlineAlert>
      )}

      {open && (
        <ActionDialog
          open
          onOpenChange={(o) => !o && setOpen(false)}
          title="Mark yourself unavailable"
          description="New bookings are paused. Patients with upcoming appointments are notified so they can reschedule."
          submitLabel="Mark unavailable"
          pendingLabel="Updating…"
          pending={pending}
          error={error}
          onSubmit={() => toggle(true)}
        >
          <div className="space-y-1.5">
            <Label htmlFor="unavailable-reason">Reason (optional)</Label>
            <Input
              id="unavailable-reason"
              value={reason}
              maxLength={200}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Attending a conference"
            />
          </div>
        </ActionDialog>
      )}
    </div>
  );
}
