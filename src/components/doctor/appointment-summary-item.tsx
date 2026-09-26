import Link from "next/link";
import { Building2, Video } from "lucide-react";
import type { Appointment } from "@/types";
import { formatDate } from "@/lib/utils";
import { formatTime12 } from "@/lib/time";
import { buttonVariants } from "@/components/ui/button";
import { AppointmentStatusBadge } from "@/components/shared/status-badge";
import { AcceptButton } from "@/components/doctor/accept-button";

/** Compact dashboard line for one appointment: time, patient, service, type, status, Join / Accept. */
export function AppointmentSummaryItem({ appointment: a, showDate = false }: { appointment: Appointment; showDate?: boolean }) {
  const online = a.consultationType === "ONLINE";
  const joinable = online && (a.status === "CONFIRMED" || a.status === "RESCHEDULED");
  const pending = a.status === "PENDING";

  return (
    <div
      className={`flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border px-4 py-3 transition-all hover:-translate-y-0.5 hover:shadow-md ${
        pending ? "border-amber-300 bg-amber-50/60" : "border-border bg-white"
      }`}
    >
      <div className="w-24 shrink-0 text-sm font-semibold text-navy">
        {showDate && <span className="block text-xs font-medium text-slate-600">{formatDate(a.date)}</span>}
        {formatTime12(a.startTime)}
      </div>
      <div className="min-w-0 flex-1 basis-40">
        <p className="truncate font-medium text-navy">
          <Link
            href={`/doctor/patients/${a.patientId}`}
            className="hover:text-cyan hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
          >
            {a.patientName}
          </Link>
        </p>
        <p className="flex items-center gap-1.5 truncate text-sm text-slate-600">
          {online ? <Video className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
          <span className="sr-only">{online ? "Online consultation:" : "In-person visit:"}</span>
          {a.serviceName}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <AppointmentStatusBadge status={a.status} />
        {joinable && (
          <Link href={`/consultation/${a.id}`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
            <Video aria-hidden="true" /> Join
          </Link>
        )}
        {pending && <AcceptButton appointmentId={a.id} />}
      </div>
    </div>
  );
}
