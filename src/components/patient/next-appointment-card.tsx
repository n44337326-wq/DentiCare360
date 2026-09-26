import Link from "next/link";
import { CalendarClock, CalendarPlus, Video, MapPin } from "lucide-react";
import { formatLongDate, formatTime12 } from "@/lib/time";
import type { Appointment } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/states";
import { DoctorAvatar } from "@/components/shared/doctor-avatar";
import { AppointmentStatusBadge } from "@/components/shared/status-badge";
import { canJoinOnline } from "@/components/patient/appointment-utils";
import { JoinConsultationButton } from "@/components/patient/join-consultation-button";

export function NextAppointmentCard({ appointment: a }: { appointment: Appointment | null }) {
  if (!a) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="No upcoming appointments"
        description="Book a visit with one of our dentists, dermatologists or general practitioners."
        action={
          <Button asChild>
            <Link href="/appointments/book">
              <CalendarPlus aria-hidden="true" /> Book appointment
            </Link>
          </Button>
        }
      />
    );
  }

  const online = a.consultationType === "ONLINE";
  return (
    <Card className="overflow-hidden border-navy/15 bg-soft-blue/50 animate-fade-in-up">
      <CardContent className="space-y-5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan">Your next appointment</p>
          <AppointmentStatusBadge status={a.status} />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <DoctorAvatar name={a.doctorName} size="lg" />
          <div className="min-w-0">
            <p className="text-xl font-semibold text-navy">{a.doctorName}</p>
            <p className="text-sm text-navy/80">
              {a.serviceName}
              {a.specialtyName ? ` · ${a.specialtyName}` : ""}
            </p>
          </div>
        </div>

        <div className="grid gap-3 text-navy sm:grid-cols-2">
          <p className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 shrink-0 text-cyan" aria-hidden="true" />
            <span>
              <span className="block font-semibold">{formatLongDate(a.date)}</span>
              <span className="text-sm">
                {formatTime12(a.startTime)} – {formatTime12(a.endTime)}
              </span>
            </span>
          </p>
          <p className="flex items-center gap-2">
            {online ? (
              <Video className="h-5 w-5 shrink-0 text-cyan" aria-hidden="true" />
            ) : (
              <MapPin className="h-5 w-5 shrink-0 text-cyan" aria-hidden="true" />
            )}
            <span className="font-medium">{online ? "Online consultation" : "In-person visit"}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-start gap-2">
          {online && canJoinOnline(a) && <JoinConsultationButton appointment={a} />}
          <Button variant="outline" asChild>
            <Link href="/patient/appointments">Manage appointment</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
