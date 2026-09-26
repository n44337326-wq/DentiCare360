import Link from "next/link";
import { CalendarClock, CircleCheck, PauseCircle, Settings2 } from "lucide-react";
import type { Doctor } from "@/types";
import { formatLongDate, formatTime12 } from "@/lib/time";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AvailabilityToggle } from "@/components/doctor/availability-toggle";

/** Doctor's current availability: working today?, next open slot, temporary-unavailable state and a quick toggle. */
export function AvailabilityStatusCard({
  doctor,
  workingToday,
  next,
}: {
  doctor: Pick<Doctor, "id" | "isTemporarilyUnavailable" | "unavailableReason">;
  workingToday: boolean;
  next: { date: string; startTime: string } | null;
}) {
  const paused = doctor.isTemporarilyUnavailable;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {paused ? (
            <PauseCircle className="h-5 w-5 text-amber-700" aria-hidden="true" />
          ) : (
            <CircleCheck className="h-5 w-5 text-green" aria-hidden="true" />
          )}
          Availability
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {paused ? (
            <Badge variant="warning">Temporarily unavailable</Badge>
          ) : (
            <Badge variant="success">Accepting bookings</Badge>
          )}
          <Badge variant={workingToday && !paused ? "cyan" : "outline"}>
            {workingToday ? "Working today" : "Not working today"}
          </Badge>
        </div>

        {paused ? (
          <p className="text-sm text-slate-700">
            Patients cannot book you right now
            {doctor.unavailableReason ? <> — “{doctor.unavailableReason}”</> : "."}{" "}
            <Link href="/doctor/availability" className="font-medium text-cyan underline-offset-4 hover:underline">
              Manage availability
            </Link>
          </p>
        ) : next ? (
          <p className="flex items-start gap-2 text-sm text-slate-700">
            <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-cyan" aria-hidden="true" />
            <span>
              Next open slot: <strong className="text-navy">{formatLongDate(next.date)}, {formatTime12(next.startTime)}</strong>
            </span>
          </p>
        ) : (
          <p className="text-sm text-slate-700">
            No open slots in the next two months.{" "}
            <Link href="/doctor/availability" className="font-medium text-cyan underline-offset-4 hover:underline">
              Review your working hours
            </Link>
          </p>
        )}

        <div className="flex flex-wrap items-start gap-2">
          <AvailabilityToggle doctorId={doctor.id} isTemporarilyUnavailable={paused} />
          <Link
            href="/doctor/availability"
            className="inline-flex h-8 items-center gap-2 rounded-lg px-3 text-xs font-medium text-navy hover:bg-soft-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
          >
            <Settings2 className="h-4 w-4" aria-hidden="true" /> Edit schedule
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
