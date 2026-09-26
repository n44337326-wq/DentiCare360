"use client";

import { useState } from "react";
import type { Doctor } from "@/types";
import { fieldError } from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ActionDialog } from "@/components/doctor/action-dialog";
import { useDoctorPatch } from "@/components/admin/use-doctor-patch";

export function FeeDialog({ doctor, onClose }: { doctor: Doctor; onClose: () => void }) {
  const [fee, setFee] = useState(String(doctor.consultationFee));
  const [localError, setLocalError] = useState<string | null>(null);
  const { patch, pending, error, rawError } = useDoctorPatch(doctor.id, onClose);

  function submit() {
    const value = Number(fee);
    if (fee.trim() === "" || !Number.isFinite(value) || value < 0 || value > 10_000) {
      setLocalError("Enter a fee between 0 and 10,000.");
      return;
    }
    setLocalError(null);
    void patch({ consultationFee: Math.round(value * 100) / 100 });
  }

  const message = localError ?? fieldError(rawError, "consultationFee");
  return (
    <ActionDialog
      open
      onOpenChange={(o) => !o && onClose()}
      title="Edit consultation fee"
      description={`Set the fee patients are charged for a consultation with ${doctor.name}. It applies to new bookings.`}
      submitLabel="Save fee"
      pending={pending}
      error={message ? null : error}
      onSubmit={submit}
    >
      <div className="space-y-1.5">
        <Label htmlFor={`fee-${doctor.id}`}>Consultation fee (USD)</Label>
        <Input
          id={`fee-${doctor.id}`}
          type="number"
          inputMode="decimal"
          min={0}
          max={10000}
          step="0.01"
          value={fee}
          onChange={(e) => setFee(e.target.value)}
          aria-invalid={!!message}
          aria-describedby={message ? `fee-${doctor.id}-err` : undefined}
        />
        {message && (
          <p id={`fee-${doctor.id}-err`} role="alert" className="text-xs text-red-700">
            {message}
          </p>
        )}
      </div>
    </ActionDialog>
  );
}

export function UnavailableDialog({ doctor, onClose }: { doctor: Doctor; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const { patch, pending, error } = useDoctorPatch(doctor.id, onClose);

  return (
    <ActionDialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={`Mark ${doctor.name} unavailable`}
      description="Patients will not be able to book this doctor until they are marked available again. Existing appointments are not cancelled."
      submitLabel="Mark unavailable"
      pendingLabel="Updating…"
      pending={pending}
      error={error}
      onSubmit={() => patch({ isTemporarilyUnavailable: true, unavailableReason: reason.trim() })}
    >
      <div className="space-y-1.5">
        <Label htmlFor={`unavail-${doctor.id}`}>Reason (optional)</Label>
        <Input id={`unavail-${doctor.id}`} value={reason} maxLength={200} onChange={(e) => setReason(e.target.value)} placeholder="e.g. On medical leave" />
      </div>
    </ActionDialog>
  );
}

export function DeactivateDialog({ doctor, onClose }: { doctor: Doctor; onClose: () => void }) {
  const { patch, pending, error } = useDoctorPatch(doctor.id, onClose);
  return (
    <ActionDialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={`Deactivate ${doctor.name}?`}
      description="The doctor disappears from the public site and can no longer be booked. Their account, history and existing appointments are kept, and you can reactivate them at any time."
      submitLabel="Deactivate doctor"
      pendingLabel="Deactivating…"
      pending={pending}
      error={error}
      destructive
      onSubmit={() => patch({ isActive: false })}
    />
  );
}
