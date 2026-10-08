import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, CalendarClock, MapPin, Star } from "lucide-react";
import type { Doctor } from "@/types";
import type { NextAvailable } from "@/lib/availability";
import { formatShortDate, formatTime12 } from "@/lib/time";
import { formatCurrency } from "@/lib/utils";
import { DoctorCardFx } from "./doctor-card-fx";
import "./doctor-card-rich.css";

function initials(name: string) {
  return name
    .replace(/^Dr\.?\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

/** Dark "glass" doctor card for /doctors: aurora background, stat strip, glowing booking bar. */
export function RichDoctorCard({ doctor, next, index }: { doctor: Doctor; next: NextAvailable | null; index: number }) {
  const unavailable = doctor.isTemporarilyUnavailable;
  const hasSlot = !unavailable && !!next;
  const fee = formatCurrency(doctor.consultationFee).replace(/\.00$/, "");
  const modes = [doctor.supportsInPerson && "In-person", doctor.supportsOnline && "Online"].filter(Boolean).join(" · ");

  return (
    <li className="dpn" style={{ animationDelay: `${Math.min(index, 11) * 80}ms`, "--dpn-i": Math.min(index, 11) } as CSSProperties}>
      <DoctorCardFx>
        <span className="dpn-aurora dpn-aurora-a" aria-hidden="true" />
        <span className="dpn-aurora dpn-aurora-b" aria-hidden="true" />
        <span className="dpn-spot" aria-hidden="true" />
        <span className="dpn-bubbles" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5].map((b) => (
            <i key={b} style={{ "--b": b } as CSSProperties} />
          ))}
        </span>
        <svg className="dpn-ecg" viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 20h120l10-14 12 28 12-34 10 20h40l8-6 8 6h180" pathLength="1" />
        </svg>
        <span className="dpn-mark" aria-hidden="true">{initials(doctor.name)}</span>

        <header className="dpn-head">
          <span className="dpn-badge" aria-hidden="true">{initials(doctor.name)}</span>
          <div className="min-w-0 flex-1">
            <h3 className="flex items-center gap-1.5 text-[1.02rem] font-black leading-tight text-white">
              <span className="truncate">{doctor.name}</span>
              <BadgeCheck className="h-4 w-4 shrink-0 text-cyan-300" aria-label="Verified" />
            </h3>
            <p className="mt-0.5 truncate text-[0.82rem] font-bold text-cyan-100">{doctor.specialtyName}</p>
            <p className="mt-1 flex items-center gap-1 truncate text-[0.7rem] font-semibold text-white/60">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
              {doctor.location.replace("DentiCare360 ", "")}
              {modes && <span> · {modes}</span>}
            </p>
          </div>
          <span className="dpn-status" data-off={!hasSlot}>
            <span className="dpn-dot" aria-hidden="true" />
            {unavailable ? "Unavailable" : next ? "Available" : "Booked"}
          </span>
        </header>

        <dl className="dpn-stats">
          <div>
            <dt>Rating</dt>
            <dd>
              <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" aria-hidden="true" /> {doctor.rating.toFixed(1)}
              <small>({doctor.reviewCount})</small>
            </dd>
          </div>
          <div>
            <dt>Experience</dt>
            <dd>{doctor.experienceYears} yrs</dd>
          </div>
          <div>
            <dt>Consult from</dt>
            <dd>{fee}</dd>
          </div>
        </dl>

        <footer className="dpn-foot">
          <p className="dpn-slot">
            <CalendarClock className="h-4 w-4 shrink-0 text-cyan-300" aria-hidden="true" />
            <span className="leading-tight">
              <span className="block text-[0.6rem] font-extrabold uppercase tracking-widest text-white/50">Next available</span>
              <span className="block text-[0.82rem] font-black text-white">
                {unavailable ? "Unavailable" : next ? `${formatShortDate(next.date)} · ${formatTime12(next.slot.startTime)}` : "No open slots"}
              </span>
            </span>
          </p>
          <Link href={`/doctors/${doctor.id}`} aria-label={`View profile of ${doctor.name}`} className="dpn-ghost">
            Profile
          </Link>
          <Link href={`/appointments/book?doctor=${doctor.id}`} aria-label={`Book appointment with ${doctor.name}`} className="dpn-book">
            Book <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </footer>
      </DoctorCardFx>
    </li>
  );
}
