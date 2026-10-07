import Link from "next/link";
import { ArrowRight, BadgeCheck, Building2, Languages, MapPin, Monitor, Star } from "lucide-react";
import type { Doctor } from "@/types";
import type { NextAvailable } from "@/lib/availability";
import { formatShortDate, formatTime12 } from "@/lib/time";
import { formatCurrency } from "@/lib/utils";
import { DoctorAvatar } from "@/components/shared/doctor-avatar";
import "./doctor-card-rich.css";

/** Compact "ticket" card for the /doctors listing: profile on the left, a coloured booking stub on the right. */
export function RichDoctorCard({ doctor, next, index }: { doctor: Doctor; next: NextAvailable | null; index: number }) {
  const unavailable = doctor.isTemporarilyUnavailable;
  const fee = formatCurrency(doctor.consultationFee).replace(/\.00$/, "");
  const hasSlot = !unavailable && !!next;

  return (
    <li className="dpt" style={{ animationDelay: `${Math.min(index, 11) * 70}ms` }}>
      <article className="dpt-card">
        <div className="dpt-main">
          <div className="dpt-avatar">
            <span className="dpt-ring" aria-hidden="true" />
            <DoctorAvatar name={doctor.name} photoUrl={doctor.photoUrl} size="md" className="dpt-avatar-img" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="flex items-center gap-1.5 text-base font-black leading-tight text-navy">
              <span className="truncate">{doctor.name}</span>
              <BadgeCheck className="h-4 w-4 shrink-0 text-cyan" aria-label="Verified" />
            </h3>
            <p className="mt-0.5 truncate text-[0.82rem] font-bold text-cyan">{doctor.specialtyName}</p>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-navy/65">
              <span className="inline-flex items-center gap-1 text-navy">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                <b className="font-black">{doctor.rating.toFixed(1)}</b>
                <span className="text-navy/50">({doctor.reviewCount})</span>
              </span>
              <span aria-hidden="true" className="h-1 w-1 rounded-full bg-navy/25" />
              <span>{doctor.experienceYears} yrs exp</span>
            </p>
            <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Consultation options">
              {doctor.supportsInPerson && (
                <li className="dpt-chip">
                  <Building2 className="h-3 w-3" aria-hidden="true" /> In-person
                </li>
              )}
              {doctor.supportsOnline && (
                <li className="dpt-chip">
                  <Monitor className="h-3 w-3" aria-hidden="true" /> Online
                </li>
              )}
            </ul>
            <p className="dpt-meta">
              <span className="inline-flex min-w-0 items-center gap-1">
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{doctor.location.replace("DentiCare360 ", "")}</span>
              </span>
              {doctor.languages.length > 0 && (
                <span className="inline-flex min-w-0 items-center gap-1">
                  <Languages className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{doctor.languages.slice(0, 2).join(", ")}</span>
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="dpt-stub" data-off={!hasSlot}>
          <p className="dpt-stub-label">
            <span className="dpt-dot" aria-hidden="true" />
            {unavailable ? "Status" : "Next slot"}
          </p>
          {hasSlot ? (
            <p className="mt-1 leading-tight">
              <span className="block text-lg font-black">{formatTime12(next.slot.startTime)}</span>
              <span className="block text-xs font-semibold text-white/85">{formatShortDate(next.date)}</span>
            </p>
          ) : (
            <p className="mt-1 text-sm font-black leading-tight">{unavailable ? "Unavailable" : "No open slots"}</p>
          )}
          <p className="mt-2 text-[0.7rem] font-semibold text-white/80">
            From <b className="text-sm font-black text-white">{fee}</b>
          </p>
          <Link href={`/appointments/book?doctor=${doctor.id}`} aria-label={`Book appointment with ${doctor.name}`} className="dpt-book">
            Book <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          <Link href={`/doctors/${doctor.id}`} aria-label={`View profile of ${doctor.name}`} className="dpt-profile">
            Profile
          </Link>
        </div>
      </article>
    </li>
  );
}
