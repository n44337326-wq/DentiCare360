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

export function DoctorCard({
  doctor,
  next,
  index = 0,
}: {
  doctor: Doctor;
  next: NextAvailable | null;
  index?: number;
}) {
  const unavailable = doctor.isTemporarilyUnavailable;

  return (
    <li className="animate-fade-in-up" style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}>
      <Card className="group flex h-full flex-col p-4 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg bg-white border border-slate-200">
        {/* Compact Header with Avatar */}
        <div className="flex items-start gap-3 mb-3">
          <div className="transition-transform duration-300 group-hover:scale-110">
            <DoctorAvatar name={doctor.name} photoUrl={doctor.photoUrl} size="md" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-black text-navy truncate">{doctor.name}</h3>
            <p className="text-xs text-cyan font-semibold">{doctor.specialtyName}</p>
            <div className="flex items-center gap-1 mt-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" aria-hidden="true" />
              <span className="font-bold text-xs text-navy">{doctor.rating.toFixed(1)}</span>
              <span className="text-navy/60 text-xs">({doctor.reviewCount})</span>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="mb-2">
          {unavailable ? (
            <Badge variant="warning" className="bg-amber-100 text-amber-900 border-amber-200 text-xs">
              Unavailable
            </Badge>
          ) : next ? (
            <Badge variant="success" className="bg-green-100 text-green-900 border-green-200 text-xs">
              Available
            </Badge>
          ) : (
            <Badge variant="outline" className="border-slate-200 text-slate-600 text-xs">
              Fully booked
            </Badge>
          )}
        </div>

        {/* Quick Info */}
        <div className="flex gap-3 text-xs text-navy/70 mb-2 pb-2 border-b border-slate-100">
          <span><span className="font-semibold">{doctor.experienceYears}y</span> exp</span>
          <span className="text-cyan font-bold">
            {unavailable ? "—" : next ? formatTime12(next.slot.startTime) : "—"}
          </span>
        </div>

        {/* Details - Compact */}
        <ul className="flex gap-2 text-xs text-navy/75 mb-3" aria-label="Consultation options">
          {doctor.supportsInPerson && (
            <li className="flex items-center gap-1">
              <Building2 className="h-3 w-3 text-cyan" aria-hidden="true" /> In-person
            </li>
          )}
          {doctor.supportsOnline && (
            <li className="flex items-center gap-1">
              <Monitor className="h-3 w-3 text-cyan" aria-hidden="true" /> Online
            </li>
          )}
        </ul>

        <p className="text-xs text-navy/80 mb-3 font-semibold">
          From <span className="text-cyan font-bold">{formatCurrency(doctor.consultationFee)}</span>
        </p>

        <div className="mt-auto flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 text-xs transition-all duration-300 hover:shadow-md" asChild>
            <Link href={`/doctors/${doctor.id}`} aria-label={`View profile of ${doctor.name}`}>
              Profile
            </Link>
          </Button>
          <Button size="sm" className="flex-1 text-xs transition-all duration-300 hover:shadow-lg bg-gradient-to-r from-cyan to-blue text-white font-bold" asChild>
            <Link href={`/appointments/book?doctor=${doctor.id}`} aria-label={`Book appointment with ${doctor.name}`}>
              Book
            </Link>
          </Button>
        </div>
      </Card>
    </li>
  );
}

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
