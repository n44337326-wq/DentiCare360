"use client";

import { useState } from "react";
import { Building2, Video } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InlineAlert } from "@/components/shared/states";
import type { ConsultationType, Role } from "@/types";
import { AuthGate } from "@/components/booking/auth-gate";
import { SummaryList } from "@/components/booking/booking-summary";
import { supportedTypes, type BookingDerived, type BookingState } from "@/components/booking/booking-state";
import { ChoiceCard } from "@/components/booking/choice-card";

const NOTES_MAX = 1000;

export function StepDetails({
  state,
  derived,
  role,
  returnUrl,
  onName,
  onNotes,
  onConsultation,
}: {
  state: BookingState;
  derived: BookingDerived;
  /** null when signed out. */
  role: Role | null;
  returnUrl: string;
  onName: (value: string) => void;
  onNotes: (value: string) => void;
  onConsultation: (value: ConsultationType) => void;
}) {
  const [nameTouched, setNameTouched] = useState(false);
  const types = supportedTypes(derived.doctor);
  const nameInvalid = nameTouched && derived.patientName.trim().length < 2;

  return (
    <div className="space-y-6">
      {role !== "PATIENT" && <AuthGate role={role} returnUrl={returnUrl} />}

      <div className="space-y-2">
        <Label htmlFor="patient-name">Patient full name</Label>
        <Input
          id="patient-name"
          value={derived.patientName}
          onChange={(e) => onName(e.target.value)}
          onBlur={() => setNameTouched(true)}
          autoComplete="name"
          maxLength={150}
          required
          aria-invalid={nameInvalid}
          aria-describedby={nameInvalid ? "patient-name-error" : undefined}
          className="h-11"
        />
        {nameInvalid && (
          <p id="patient-name-error" role="alert" className="text-sm text-red-700">
            Enter the patient&apos;s full name (at least 2 characters).
          </p>
        )}
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium text-navy">Consultation type</legend>
        {types.length === 0 ? (
          <InlineAlert variant="error" title="No visit types available">
            This doctor is not offering in-person or online visits right now. Please choose another doctor.
          </InlineAlert>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {types.map((type) => (
              <ChoiceCard
                key={type}
                name="consultation-type"
                value={type}
                checked={state.consultationType === type}
                onChange={() => onConsultation(type)}
              >
                <span className="flex items-center gap-2 font-medium text-navy">
                  {type === "ONLINE" ? <Video className="h-4 w-4" aria-hidden="true" /> : <Building2 className="h-4 w-4" aria-hidden="true" />}
                  {type === "ONLINE" ? "Online" : "In person"}
                </span>
                <span className="mt-0.5 block text-sm text-slate-600">
                  {type === "ONLINE" ? "Video visit — the join link appears in your patient portal." : `Visit the clinic${derived.doctor ? ` in ${derived.doctor.location}` : ""}.`}
                </span>
              </ChoiceCard>
            ))}
          </div>
        )}
        {types.length === 1 && (
          <p className="text-xs text-slate-600">This doctor only offers {types[0] === "ONLINE" ? "online" : "in-person"} visits.</p>
        )}
      </fieldset>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <Label htmlFor="patient-notes">
            Notes for the doctor <span className="font-normal text-slate-600">(optional)</span>
          </Label>
          <span id="notes-count" className="text-xs text-slate-600" aria-live="off">
            {state.notes.length}/{NOTES_MAX}
          </span>
        </div>
        <Textarea
          id="patient-notes"
          value={state.notes}
          onChange={(e) => onNotes(e.target.value)}
          maxLength={NOTES_MAX}
          rows={4}
          placeholder="Symptoms, questions or anything the doctor should know before the visit"
          aria-describedby="notes-count"
        />
      </div>

      <section aria-labelledby="details-summary" className="rounded-xl border border-border bg-soft-blue/50 p-4 lg:hidden">
        <h3 id="details-summary" className="mb-3 text-sm font-semibold text-navy">
          Your booking so far
        </h3>
        <SummaryList state={state} derived={derived} />
      </section>
    </div>
  );
}
