"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, CalendarClock, Check, Loader2, NotebookPen, Stethoscope, UserX, Video, X } from "lucide-react";
import type { Appointment } from "@/types";
import { allowedActions, type AppointmentActionName } from "@/lib/appointment-rules";
import { formatDate } from "@/lib/utils";
import { formatTime12 } from "@/lib/time";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InlineAlert } from "@/components/shared/states";
import { AppointmentStatusBadge } from "@/components/shared/status-badge";
import { AiSummaryPanel } from "@/components/doctor/ai-summary-panel";
import { CancelDialog } from "@/components/doctor/cancel-dialog";
import { CompleteDialog } from "@/components/doctor/complete-dialog";
import { NoShowDialog } from "@/components/doctor/no-show-dialog";
import { NotesDialog } from "@/components/doctor/notes-dialog";
import { RescheduleDialog } from "@/components/doctor/reschedule-dialog";
import { useAppointmentAction } from "@/components/doctor/use-appointment-action";
import { cn } from "@/lib/utils";

type DialogName = "reschedule" | "complete" | "no_show" | "note" | "cancel";

/** One appointment with every lifecycle action the caller's role may perform (decided by `allowedActions`). */
export function AppointmentRow({
  appointment: a,
  role,
  showDoctor = false,
  linkPatient = false,
  highlightPending = false,
}: {
  appointment: Appointment;
  role: "DOCTOR" | "ADMIN";
  showDoctor?: boolean;
  linkPatient?: boolean;
  highlightPending?: boolean;
}) {
  const [dialog, setDialog] = useState<DialogName | null>(null);
  const accept = useAppointmentAction(a.id);
  const actions = allowedActions(a, role);
  // Admins manage the schedule and status; clinical notes and AI symptom summaries stay with the treating doctor.
  const clinical = role === "DOCTOR";
  const can = (name: AppointmentActionName) => actions.includes(name) && (clinical || name !== "note");
  const close = () => setDialog(null);

  const online = a.consultationType === "ONLINE";
  const joinable = online && (a.status === "CONFIRMED" || a.status === "RESCHEDULED");

  return (
    <Card
      className={cn(
        "transition-all hover:-translate-y-0.5",
        highlightPending && a.status === "PENDING" && "border-amber-300 bg-amber-50/50"
      )}
    >
      <CardContent className="space-y-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-base font-semibold text-navy">
              {linkPatient ? (
                <Link
                  href={`/doctor/patients/${a.patientId}`}
                  className="hover:text-cyan hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
                >
                  {a.patientName}
                </Link>
              ) : (
                a.patientName
              )}
            </p>
            <p className="text-sm text-slate-600">
              {a.serviceName}
              {showDoctor && <> · with {a.doctorName}</>}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-1 text-slate-700">
              {online ? <Video className="h-3 w-3" aria-hidden="true" /> : <Building2 className="h-3 w-3" aria-hidden="true" />}
              {online ? "Online" : "In person"}
            </Badge>
            <AppointmentStatusBadge status={a.status} />
          </div>
        </div>

        <p className="flex items-center gap-2 text-sm font-medium text-navy">
          <CalendarClock className="h-4 w-4 text-cyan" aria-hidden="true" />
          {formatDate(a.date)}, {formatTime12(a.startTime)} – {formatTime12(a.endTime)}
        </p>

        {a.notes && (
          <div className="rounded-lg bg-soft-blue px-3 py-2 text-sm">
            <p className="text-xs font-semibold text-slate-700">Patient notes</p>
            <p className="whitespace-pre-line text-navy">{a.notes}</p>
          </div>
        )}
        {clinical && a.aiSummary && <AiSummaryPanel summary={a.aiSummary} />}
        {clinical && a.doctorNotes && (
          <div className="rounded-lg border border-border px-3 py-2 text-sm">
            <p className="flex items-center gap-1 text-xs font-semibold text-slate-700">
              <Stethoscope className="h-3 w-3" aria-hidden="true" /> Clinical notes
            </p>
            <p className="whitespace-pre-line text-navy">{a.doctorNotes}</p>
          </div>
        )}

        {accept.error && <InlineAlert variant="error">{accept.error}</InlineAlert>}
        {accept.succeeded && <InlineAlert variant="success">Appointment accepted. The patient has been notified.</InlineAlert>}

        <div className="flex flex-wrap gap-2 pt-1">
          {joinable && (
            <Link href={`/consultation/${a.id}`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
              <Video aria-hidden="true" /> Join
            </Link>
          )}
          {can("accept") && (
            <Button
              size="sm"
              variant={highlightPending ? "default" : "outline"}
              disabled={accept.pending}
              onClick={() => accept.perform({ action: "accept" })}
            >
              {accept.pending ? <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Check aria-hidden="true" />}
              {accept.pending ? "Accepting…" : "Accept"}
            </Button>
          )}
          {can("complete") && (
            <Button size="sm" variant="outline" onClick={() => setDialog("complete")}>
              <Check aria-hidden="true" /> Mark completed
            </Button>
          )}
          {can("reschedule") && (
            <Button size="sm" variant="outline" onClick={() => setDialog("reschedule")}>
              <CalendarClock aria-hidden="true" /> Reschedule
            </Button>
          )}
          {can("no_show") && (
            <Button size="sm" variant="outline" onClick={() => setDialog("no_show")}>
              <UserX aria-hidden="true" /> No-show
            </Button>
          )}
          {can("note") && (
            <Button size="sm" variant="ghost" onClick={() => setDialog("note")}>
              <NotebookPen aria-hidden="true" /> {a.doctorNotes ? "Edit notes" : "Add notes"}
            </Button>
          )}
          {can("cancel") && (
            <Button size="sm" variant="ghost" className="text-red-700 hover:bg-red-50" onClick={() => setDialog("cancel")}>
              <X aria-hidden="true" /> Cancel
            </Button>
          )}
        </div>
      </CardContent>

      {dialog === "reschedule" && <RescheduleDialog appointment={a} onClose={close} />}
      {dialog === "complete" && <CompleteDialog appointment={clinical ? a : { ...a, doctorNotes: undefined }} onClose={close} />}
      {dialog === "no_show" && <NoShowDialog appointment={a} onClose={close} />}
      {dialog === "note" && <NotesDialog appointment={a} onClose={close} />}
      {dialog === "cancel" && <CancelDialog appointment={a} onClose={close} />}
    </Card>
  );
}
