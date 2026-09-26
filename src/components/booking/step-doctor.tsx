"use client";

import { Building2, CalendarClock, Star, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/states";
import { DoctorAvatar } from "@/components/shared/doctor-avatar";
import { formatShortDate, formatTime12 } from "@/lib/time";
import { formatCurrency } from "@/lib/utils";
import { ChoiceCard } from "@/components/booking/choice-card";
import type { BookingDoctor } from "@/components/booking/types";

export function StepDoctor({
  doctors,
  specialtyName,
  selectedId,
  onSelect,
  onChangeService,
}: {
  /** Already filtered to the chosen specialty. */
  doctors: BookingDoctor[];
  specialtyName: string | null;
  selectedId: string | null;
  onSelect: (doctor: BookingDoctor) => void;
  onChangeService: () => void;
}) {
  if (doctors.length === 0) {
    return (
      <EmptyState
        title={`No ${specialtyName ?? "specialty"} doctors are listed yet`}
        description="Please choose a different service, or check back soon."
        action={<Button onClick={onChangeService}>Choose another service</Button>}
      />
    );
  }

  const ordered = [...doctors].sort((a, b) => Number(a.isTemporarilyUnavailable) - Number(b.isTemporarilyUnavailable));
  const bookable = ordered.filter((d) => !d.isTemporarilyUnavailable).length;

  return (
    <div className="space-y-4">
      {bookable === 0 && (
        <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          None of our {specialtyName} doctors are taking bookings at the moment. You can choose another service instead.
        </p>
      )}
      <fieldset>
        <legend className="sr-only">Doctors</legend>
        <div className="grid gap-3">
          {ordered.map((doctor) => {
            const unavailable = doctor.isTemporarilyUnavailable;
            return (
              <ChoiceCard
                key={doctor.id}
                name="doctor"
                value={doctor.id}
                checked={selectedId === doctor.id}
                disabled={unavailable}
                onChange={() => onSelect(doctor)}
              >
                <div className="flex gap-3">
                  <DoctorAvatar name={doctor.name} photoUrl={doctor.photoUrl} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-medium text-navy">{doctor.name}</span>
                      {unavailable ? <Badge variant="warning">Unavailable</Badge> : <Badge variant="success">Available</Badge>}
                    </div>
                    <p className="text-sm text-slate-600">
                      {doctor.specialtyName} · {doctor.experienceYears} yrs experience
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-700">
                      <span className="inline-flex items-center gap-1" aria-label={`Rated ${doctor.rating.toFixed(1)} out of 5 from ${doctor.reviewCount} reviews`}>
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                        {doctor.rating.toFixed(1)} ({doctor.reviewCount})
                      </span>
                      <span className="font-semibold text-navy">{formatCurrency(doctor.consultationFee)} / visit</span>
                      {doctor.supportsInPerson && (
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                          In person
                        </span>
                      )}
                      {doctor.supportsOnline && (
                        <span className="inline-flex items-center gap-1">
                          <Video className="h-3.5 w-3.5" aria-hidden="true" />
                          Online
                        </span>
                      )}
                    </p>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-navy">
                      <CalendarClock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {unavailable
                        ? (doctor.unavailableReason ?? "Temporarily not taking new bookings.")
                        : doctor.nextAvailable
                          ? `Next available: ${formatShortDate(doctor.nextAvailable.date)}, ${formatTime12(doctor.nextAvailable.startTime)}`
                          : "No upcoming appointments are open"}
                    </p>
                  </div>
                </div>
              </ChoiceCard>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
