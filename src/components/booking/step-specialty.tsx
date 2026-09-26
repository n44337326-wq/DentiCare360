"use client";

import { Info, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState, EmptyState } from "@/components/shared/states";
import type { Service, Specialty } from "@/types";
import { ChoiceCard } from "@/components/booking/choice-card";

/**
 * The service decides the specialty, so this step confirms it rather than
 * offering unrelated ones (a doctor from another specialty could not be booked).
 */
export function StepSpecialty({
  service,
  specialty,
  availableDoctorCount,
  selectedSlug,
  onSelect,
  onChangeService,
}: {
  service: Service | null;
  specialty: Specialty | null;
  availableDoctorCount: number;
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
  onChangeService: () => void;
}) {
  if (!service) {
    return (
      <EmptyState
        title="Choose a service first"
        description="The specialty depends on the service you need."
        icon={Stethoscope}
        action={<Button onClick={onChangeService}>Choose a service</Button>}
      />
    );
  }
  if (!specialty) {
    return <ErrorState message="We couldn't load the specialty for this service. Please pick another service." onRetry={onChangeService} />;
  }

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="sr-only">Specialty for {service.name}</legend>
        <ChoiceCard name="specialty" value={specialty.slug} checked={selectedSlug === specialty.slug} onChange={onSelect}>
          <span className="block font-medium text-navy">{specialty.name}</span>
          <span className="mt-0.5 block text-sm text-slate-600">{specialty.description}</span>
          <span className="mt-2 block text-xs text-slate-700">
            {availableDoctorCount > 0
              ? `${availableDoctorCount} ${availableDoctorCount === 1 ? "doctor is" : "doctors are"} currently taking bookings`
              : "No doctors are taking bookings right now"}
          </span>
        </ChoiceCard>
      </fieldset>

      <div className="flex gap-3 rounded-lg bg-cyan-light p-4 text-sm text-navy">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <div className="space-y-1">
          <p>
            <strong>{service.name}</strong> is looked after by <strong>{service.suitableSpecialist || specialty.name}</strong>.
            You&apos;ll pick a doctor from this specialty next, so your booking always matches the care you need.
          </p>
          <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={onChangeService}>
            Not right? Change service
          </Button>
        </div>
      </div>
    </div>
  );
}
