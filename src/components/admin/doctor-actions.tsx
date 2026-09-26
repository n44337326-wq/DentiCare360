"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarCog, CircleCheck, Loader2, PauseCircle, Pencil, Power, PowerOff } from "lucide-react";
import type { Doctor } from "@/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { InlineAlert } from "@/components/shared/states";
import { DeactivateDialog, FeeDialog, UnavailableDialog } from "@/components/admin/doctor-dialogs";
import { useDoctorPatch } from "@/components/admin/use-doctor-patch";

type DialogName = "fee" | "unavailable" | "deactivate";

/** Admin actions for one doctor: fee, activate/deactivate, temporary availability, and the schedule page. */
export function DoctorActions({ doctor }: { doctor: Doctor }) {
  const [dialog, setDialog] = useState<DialogName | null>(null);
  const { patch, pending, error } = useDoctorPatch(doctor.id);
  const close = () => setDialog(null);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        <Button size="sm" variant="outline" onClick={() => setDialog("fee")}>
          <Pencil aria-hidden="true" /> Fee<span className="sr-only"> for {doctor.name}</span>
        </Button>
        <Link href={`/admin/doctors/${doctor.id}/schedule`} className={buttonVariants({ variant: "outline", size: "sm" })}>
          <CalendarCog aria-hidden="true" /> Schedule<span className="sr-only"> for {doctor.name}</span>
        </Link>
        {doctor.isTemporarilyUnavailable ? (
          <Button size="sm" variant="outline" disabled={pending} onClick={() => patch({ isTemporarilyUnavailable: false })}>
            {pending ? <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <CircleCheck aria-hidden="true" />}
            Mark available<span className="sr-only"> {doctor.name}</span>
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setDialog("unavailable")}>
            <PauseCircle aria-hidden="true" /> Mark unavailable<span className="sr-only"> {doctor.name}</span>
          </Button>
        )}
        {doctor.isActive ? (
          <Button size="sm" variant="ghost" className="text-red-700 hover:bg-red-50" onClick={() => setDialog("deactivate")}>
            <PowerOff aria-hidden="true" /> Deactivate<span className="sr-only"> {doctor.name}</span>
          </Button>
        ) : (
          <Button size="sm" variant="secondary" disabled={pending} onClick={() => patch({ isActive: true })}>
            {pending ? <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Power aria-hidden="true" />}
            Activate<span className="sr-only"> {doctor.name}</span>
          </Button>
        )}
      </div>
      {error && !dialog && <InlineAlert variant="error">{error}</InlineAlert>}

      {dialog === "fee" && <FeeDialog doctor={doctor} onClose={close} />}
      {dialog === "unavailable" && <UnavailableDialog doctor={doctor} onClose={close} />}
      {dialog === "deactivate" && <DeactivateDialog doctor={doctor} onClose={close} />}
    </div>
  );
}
