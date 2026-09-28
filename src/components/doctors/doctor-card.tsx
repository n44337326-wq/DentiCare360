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
        className="group relative overflow-hidden flex h-full flex-col transition-all duration-500 hover:-translate-y-4 hover:shadow-2xl bg-white border-2 border-slate-100"
      >
        {/* Colored top bar with gradient */}
        <div className="h-24 bg-gradient-to-r from-cyan to-blue transition-all duration-500 group-hover:from-cyan/90 group-hover:to-blue/90 group-hover:h-28" />

        {/* Avatar positioned on gradient bar */}
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 transition-all duration-500 group-hover:top-4 group-hover:scale-125">
          <div className="p-1 bg-white rounded-full shadow-lg">
            <DoctorAvatar name={doctor.name} photoUrl={doctor.photoUrl} size="lg" />
          </div>
        </div>

        <div className="flex h-full flex-col p-6 pt-20">
          {/* Doctor Info */}
          <div className="text-center mb-4">
            <h3 className="text-xl font-black text-navy leading-tight">
              {doctor.name}
            </h3>
            <p className="text-sm text-cyan font-semibold mt-1">{doctor.specialtyName}</p>
            <p className="mt-2 flex items-center justify-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-amber-400 text-amber-500" aria-hidden="true" />
              <span className="font-bold text-navy">{doctor.rating.toFixed(1)}</span>
              <span className="text-navy/60 text-xs">
                ({doctor.reviewCount})
              </span>
            </p>
          </div>

        {/* Status Badge */}
        <div className="flex justify-center mb-4">
          {unavailable ? (
            <Badge variant="warning" className="bg-amber-100 text-amber-900 border-amber-300">
              <span className="h-2 w-2 rounded-full bg-amber-600 mr-2" aria-hidden="true" />
              Unavailable
            </Badge>
          ) : next ? (
            <Badge variant="success" className="bg-green-100 text-green-900 border-green-300">
              <span className="h-2 w-2 rounded-full bg-green-600 mr-2" aria-hidden="true" />
              Available
            </Badge>
          ) : (
            <Badge variant="outline" className="border-slate-300 text-slate-600">
              Fully booked
            </Badge>
          )}
        </div>

        {/* Experience and Next */}
        <div className="flex items-center justify-center gap-4 text-xs text-navy/70 mb-4 py-3 border-y border-slate-100">
          <span className="font-semibold">{doctor.experienceYears}y exp</span>
          <span className="text-cyan font-bold">
            {unavailable ? "Unavailable" : next ? `${formatTime12(next.slot.startTime)}` : "No slots"}
          </span>
        </div>

        {/* Details */}
        <ul className="flex flex-col gap-2 text-xs text-navy/75 mb-4" aria-label="Consultation options">
          {doctor.supportsInPerson && (
            <li className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-cyan" aria-hidden="true" /> In-person
            </li>
          )}
          {doctor.supportsOnline && (
            <li className="flex items-center gap-2">
              <Monitor className="h-3.5 w-3.5 text-cyan" aria-hidden="true" /> Online
            </li>
          )}
          <li className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-cyan" aria-hidden="true" /> {doctor.location.replace(/^DentiCare360\s+/, "")}
          </li>
        </ul>

        <p className="text-center text-sm text-navy/80 mb-4 font-semibold">
          From <span className="text-cyan font-bold">{formatCurrency(doctor.consultationFee)}</span>
        </p>

        <div className="mt-auto flex gap-2 pt-5">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 transition-all duration-300 hover:shadow-md hover:bg-slate-50 border-slate-300 hover:border-slate-400"
            asChild
          >
            <Link href={`/doctors/${doctor.id}`} aria-label={`View profile of ${doctor.name}`}>
              View Profile
            </Link>
          </Button>
          <Button
            size="sm"
            className="flex-1 transition-all duration-300 hover:shadow-lg hover:scale-105 bg-gradient-to-r from-cyan to-blue hover:from-cyan/80 hover:to-blue/80 text-white font-bold"
            asChild
          >
            <Link href={`/appointments/book?doctor=${doctor.id}`} aria-label={`Book appointment with ${doctor.name}`}>
              Book Now
            </Link>
          </Button>
        </div>
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
