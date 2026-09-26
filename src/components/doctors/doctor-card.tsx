import Link from "next/link";
import { Clock, MapPin, Monitor, Star, Building2 } from "lucide-react";
import type { Doctor } from "@/types";
import type { NextAvailable } from "@/lib/availability";
import { formatShortDate, formatTime12 } from "@/lib/time";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DoctorAvatar } from "@/components/shared/doctor-avatar";

export function nextSlotLabel(next: NextAvailable) {
  return `${formatShortDate(next.date)} · ${formatTime12(next.slot.startTime)}`;
}

/** One doctor in a grid. Used by the home page and the doctor directory. */
export function DoctorCard({
  doctor,
  next,
  index = 0,
}: {
  doctor: Doctor;
  /** The doctor's next open slot (null when none). */
  next: NextAvailable | null;
  /** Position in the grid; drives the staggered entrance. */
  index?: number;
}) {
  const unavailable = doctor.isTemporarilyUnavailable;

  return (
    <li className="animate-fade-in-up" style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}>
      <Card
        className="flex h-full flex-col p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="flex items-start gap-3">
          <DoctorAvatar name={doctor.name} photoUrl={doctor.photoUrl} size="md" />
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold text-navy">
              {doctor.name}
            </h3>
            <p className="truncate text-sm text-navy/70">{doctor.specialtyName}</p>
            <p className="mt-1 flex items-center gap-1 text-sm text-navy">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" aria-hidden="true" />
              <span className="font-medium">{doctor.rating.toFixed(1)}</span>
              <span className="text-navy/70">
                <span className="sr-only">rating from </span>({doctor.reviewCount}
                <span className="sr-only"> reviews</span>)
              </span>
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {unavailable ? (
            <Badge variant="warning" className="text-amber-900">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-600" aria-hidden="true" />
              Unavailable
            </Badge>
          ) : next ? (
            <Badge variant="success" className="text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-green" aria-hidden="true" />
              Available
            </Badge>
          ) : (
            <Badge variant="outline" className="text-navy/70">
              Fully booked
            </Badge>
          )}
          <span className="text-sm text-navy/80">{doctor.experienceYears} years experience</span>
        </div>

        <div className="mt-3 flex items-start gap-2 text-sm text-navy">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-cyan" aria-hidden="true" />
          {unavailable ? (
            <span>
              Currently unavailable
              {doctor.unavailableReason ? <span className="text-navy/70"> &mdash; {doctor.unavailableReason}</span> : null}
            </span>
          ) : next ? (
            <span>Next: {nextSlotLabel(next)}</span>
          ) : (
            <span>No open slots in the coming weeks</span>
          )}
        </div>

        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-navy/75" aria-label="Consultation options">
          {doctor.supportsInPerson && (
            <li className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" aria-hidden="true" /> In-person
            </li>
          )}
          {doctor.supportsOnline && (
            <li className="flex items-center gap-1">
              <Monitor className="h-3.5 w-3.5" aria-hidden="true" /> Online
            </li>
          )}
          <li className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {doctor.location.replace(/^DentiCare360\s+/, "")}
          </li>
        </ul>

        <p className="mt-3 text-sm text-navy/80">
          Consultation from <span className="font-medium text-navy">{formatCurrency(doctor.consultationFee)}</span>
        </p>

        <div className="mt-auto flex gap-2 pt-5">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href={`/doctors/${doctor.id}`} aria-label={`View profile of ${doctor.name}`}>
              View Profile
            </Link>
          </Button>
          <Button size="sm" className="flex-1" asChild>
            <Link href={`/appointments/book?doctor=${doctor.id}`} aria-label={`Book appointment with ${doctor.name}`}>
              Book Appointment
            </Link>
          </Button>
        </div>
      </Card>
    </li>
  );
}

/** Grid wrapper so every list of doctor cards is a real list. `columns={4}` gives a 4-up layout on wide screens. */
export function DoctorGrid({
  children,
  label,
  columns = 3,
}: {
  children: React.ReactNode;
  label: string;
  columns?: 3 | 4;
}) {
  return (
    <ul
      aria-label={label}
      className={`grid gap-5 sm:grid-cols-2 ${columns === 4 ? "xl:grid-cols-4" : "lg:grid-cols-3"}`}
    >
      {children}
    </ul>
  );
}
