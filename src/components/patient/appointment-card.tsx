"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarClock, CalendarPlus, FileText, MapPin, Sparkles, Video, X } from "lucide-react";
import { formatLongDate, formatTime12 } from "@/lib/time";
import type { PaymentStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DoctorAvatar } from "@/components/shared/doctor-avatar";
import { AppointmentStatusBadge, PaymentStatusBadge } from "@/components/shared/status-badge";
import { canJoinOnline, hasEnded, type AppointmentView } from "@/components/patient/appointment-utils";
import { CancelDialog } from "@/components/patient/cancel-dialog";
import { JoinConsultationButton } from "@/components/patient/join-consultation-button";
import { RescheduleDialog } from "@/components/patient/reschedule-dialog";

export function AppointmentCard({
  view,
  paymentStatus,
  isPast,
  onSuccess,
}: {
  view: AppointmentView;
  paymentStatus?: PaymentStatus;
  isPast: boolean;
  onSuccess: (message: string) => void;
}) {
  const { appointment: a, actions } = view;
  const [dialog, setDialog] = useState<"reschedule" | "cancel" | null>(null);
  const online = a.consultationType === "ONLINE";
  const showJoin = online && canJoinOnline(a) && !isPast && !hasEnded(a);

  return (
    <Card className="animate-fade-in transition-all hover:-translate-y-0.5">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <DoctorAvatar name={a.doctorName} />
            <div className="min-w-0">
              <p className="font-semibold text-navy">{a.doctorName}</p>
              <p className="text-sm text-muted">{a.specialtyName ?? "Specialist"}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AppointmentStatusBadge status={a.status} />
            {paymentStatus && a.status !== "CANCELLED" && <PaymentStatusBadge status={paymentStatus} />}
          </div>
        </div>

        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div className="flex items-center gap-2 text-navy">
            <CalendarClock className="h-4 w-4 shrink-0 text-cyan" aria-hidden="true" />
            <dt className="sr-only">When</dt>
            <dd>
              {formatLongDate(a.date)}, {formatTime12(a.startTime)} – {formatTime12(a.endTime)}
            </dd>
          </div>
          <div className="flex items-center gap-2 text-navy">
            {online ? (
              <Video className="h-4 w-4 shrink-0 text-cyan" aria-hidden="true" />
            ) : (
              <MapPin className="h-4 w-4 shrink-0 text-cyan" aria-hidden="true" />
            )}
            <dt className="sr-only">Visit type</dt>
            <dd>{online ? "Online consultation" : "In-person visit"}</dd>
          </div>
          <div className="flex items-center gap-2 text-navy sm:col-span-2">
            <FileText className="h-4 w-4 shrink-0 text-cyan" aria-hidden="true" />
            <dt className="sr-only">Service</dt>
            <dd>{a.serviceName}</dd>
          </div>
        </dl>

        {(a.notes || a.aiSummary || (isPast && a.doctorNotes)) && (
          <div className="space-y-2 rounded-lg bg-soft-blue/60 p-3 text-sm">
            {a.notes && (
              <p className="text-navy">
                <span className="font-medium">Your notes: </span>
                {a.notes}
              </p>
            )}
            {a.aiSummary && (
              <p className="flex items-start gap-2 text-navy">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-cyan" aria-hidden="true" />
                <span>
                  <Badge variant="cyan" className="mr-1.5">Patient-reported</Badge>
                  AI symptom summary shared with your doctor.
                </span>
              </p>
            )}
            {isPast && a.doctorNotes && (
              <p className="text-navy">
                <span className="font-medium">Doctor notes: </span>
                {a.doctorNotes}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-start gap-2">
          {showJoin && <JoinConsultationButton appointment={a} size="sm" label="Join" />}
          {actions.includes("reschedule") && (
            <Button size="sm" variant="outline" onClick={() => setDialog("reschedule")}>
              <CalendarClock aria-hidden="true" /> Reschedule
            </Button>
          )}
          {actions.includes("cancel") && (
            <Button size="sm" variant="ghost" className="text-red-700 hover:bg-red-50" onClick={() => setDialog("cancel")}>
              <X aria-hidden="true" /> Cancel
            </Button>
          )}
          {(isPast || a.status === "CANCELLED") && (
            <Button size="sm" variant="outline" asChild>
              <Link href={`/appointments/book?doctor=${encodeURIComponent(a.doctorId)}`}>
                <CalendarPlus aria-hidden="true" /> Book again
              </Link>
            </Button>
          )}
        </div>

        {actions.includes("reschedule") && (
          <RescheduleDialog appointment={a} open={dialog === "reschedule"} onOpenChange={(o) => setDialog(o ? "reschedule" : null)} onDone={onSuccess} />
        )}
        {actions.includes("cancel") && (
          <CancelDialog appointment={a} open={dialog === "cancel"} onOpenChange={(o) => setDialog(o ? "cancel" : null)} onDone={onSuccess} />
        )}
      </CardContent>
    </Card>
  );
}
