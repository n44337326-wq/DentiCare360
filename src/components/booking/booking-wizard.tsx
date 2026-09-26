"use client";

import { useEffect, useMemo, useReducer, useRef } from "react";
import { useSession } from "next-auth/react";
import { clinicToday } from "@/lib/time";
import { AuthGate } from "@/components/booking/auth-gate";
import { bookingReducer, deriveBooking, initBooking } from "@/components/booking/booking-state";
import { SummaryChips, SummaryPanel } from "@/components/booking/booking-summary";
import { BookingSuccess } from "@/components/booking/booking-success";
import { bookingReturnUrl } from "@/components/booking/booking-url";
import { ProgressSteps } from "@/components/booking/progress-steps";
import { StepConfirm } from "@/components/booking/step-confirm";
import { StepDate, StepTime } from "@/components/booking/step-date-time";
import { StepDetails } from "@/components/booking/step-details";
import { StepDoctor } from "@/components/booking/step-doctor";
import { StepService } from "@/components/booking/step-service";
import { StepSpecialty } from "@/components/booking/step-specialty";
import { STEP, STEPS, STEP_COUNT } from "@/components/booking/steps";
import type { BookingCatalog, BookingDoctor, BookingInitial, BookingUser } from "@/components/booking/types";
import { useConfirmBooking } from "@/components/booking/use-confirm-booking";
import { WizardNav } from "@/components/booking/wizard-nav";

const HINTS: Record<number, string> = {
  [STEP.service]: "Choose a service to continue",
  [STEP.specialty]: "Confirm the specialty to continue",
  [STEP.doctor]: "Choose an available doctor to continue",
  [STEP.date]: "Pick a date to continue",
  [STEP.time]: "Pick a time to continue",
  [STEP.details]: "Add your name and choose a visit type",
};

/** Shell of the 7-step booking flow: owns the state, wires the steps together, and handles focus and navigation. */
export function BookingWizard({
  catalog,
  initial,
  user,
}: {
  catalog: BookingCatalog;
  initial: BookingInitial;
  user: BookingUser | null;
}) {
  const { data: session, status } = useSession();
  const live = status === "loading" ? user : session?.user ? { role: session.user.role, name: session.user.name } : null;
  const role = live?.role ?? null;
  const canBook = role === "PATIENT";
  const defaultName = live?.name ?? "";

  const [state, dispatch] = useReducer(bookingReducer, { catalog, initial, defaultName: user?.name ?? "" }, initBooking);
  const derived = useMemo(() => deriveBooking(state, catalog, defaultName), [state, catalog, defaultName]);
  const { confirm, pending, error, clearError } = useConfirmBooking(state, derived, dispatch);

  // Move focus to the step heading whenever the step (or the result) changes.
  const headingRef = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    headingRef.current?.focus();
  }, [state.step, state.confirmed]);

  const { step } = state;
  const meta = STEPS[step - 1];
  const reachable = canBook ? derived.reachable : Math.min(derived.reachable, STEP.details);
  const returnUrl = bookingReturnUrl(state, derived.service, derived.doctor);

  const go = (target: number) => {
    clearError();
    dispatch({ type: "goto", step: target });
  };

  const specialty = catalog.specialties.find((s) => s.slug === derived.service?.specialtySlug) ?? null;
  const specialtyDoctors = catalog.doctors.filter((d) => d.specialtySlug === derived.service?.specialtySlug);
  const selectDoctor = (doctor: BookingDoctor) => dispatch({ type: "doctor", doctor, today: clinicToday() });

  const canNext = step === STEP_COUNT ? derived.valid[STEP.confirm] && canBook : derived.valid[step] && (step !== STEP.details || canBook);
  const hint = step === STEP.details && !canBook ? "Sign in with a patient account to continue" : HINTS[step];

  const renderStep = () => {
    switch (step) {
      case STEP.service:
        return (
          <StepService
            services={catalog.services}
            specialties={catalog.specialties}
            selectedId={state.serviceId}
            focusSpecialtySlug={state.serviceId ? null : state.specialtySlug}
            onSelect={(service) => dispatch({ type: "service", service })}
          />
        );
      case STEP.specialty:
        return (
          <StepSpecialty
            service={derived.service}
            specialty={specialty}
            availableDoctorCount={specialtyDoctors.filter((d) => !d.isTemporarilyUnavailable).length}
            selectedSlug={state.specialtySlug}
            onSelect={(slug) => dispatch({ type: "specialty", slug })}
            onChangeService={() => go(STEP.service)}
          />
        );
      case STEP.doctor:
        return (
          <StepDoctor
            doctors={specialtyDoctors}
            specialtyName={derived.specialtyName}
            selectedId={state.doctorId}
            onSelect={selectDoctor}
            onChangeService={() => go(STEP.service)}
          />
        );
      case STEP.date:
        return (
          <StepDate
            doctor={derived.doctor}
            date={state.date}
            refreshKey={state.refreshKey}
            onSelect={(date) => dispatch({ type: "date", date })}
            onPickDoctor={() => go(STEP.doctor)}
          />
        );
      case STEP.time:
        return (
          <StepTime
            doctor={derived.doctor}
            date={state.date}
            startTime={state.startTime}
            slotWarning={state.slotWarning}
            refreshKey={state.refreshKey}
            onSelect={(sel) => dispatch({ type: "slot", date: sel.date, startTime: sel.startTime })}
            onChangeDate={() => go(STEP.date)}
            onPickDoctor={() => go(STEP.doctor)}
          />
        );
      case STEP.details:
        return (
          <StepDetails
            state={state}
            derived={derived}
            role={role}
            returnUrl={returnUrl}
            onName={(value) => dispatch({ type: "name", value })}
            onNotes={(value) => dispatch({ type: "notes", value })}
            onConsultation={(value) => dispatch({ type: "consultation", value })}
          />
        );
      default:
        return (
          <div className="space-y-5">
            {!canBook && <AuthGate role={role} returnUrl={returnUrl} />}
            <StepConfirm state={state} derived={derived} error={error} pending={pending} />
          </div>
        );
    }
  };

  const confirmed = state.confirmed;

  return (
    <div className="pb-28 lg:pb-0">
      <ProgressSteps step={step} reachable={reachable} complete={!!confirmed} onSelect={go} />
      {!confirmed && (
        <div className="mt-4">
          <SummaryChips state={state} derived={derived} />
        </div>
      )}

      <div className={confirmed ? "mt-6" : "mt-6 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]"}>
        <div className={confirmed ? "mx-auto w-full max-w-2xl" : undefined}>
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm sm:p-7">
            {confirmed ? (
              <BookingSuccess
                ref={headingRef}
                appointment={confirmed}
                doctor={catalog.doctors.find((d) => d.id === confirmed.doctorId) ?? derived.doctor}
                onBookAnother={() => dispatch({ type: "reset", conversationId: null })}
              />
            ) : (
              <>
                <h2 ref={headingRef} tabIndex={-1} className="text-xl font-semibold text-navy focus:outline-none sm:text-2xl">
                  {meta.title}
                </h2>
                <p className="mb-6 mt-1 text-sm text-slate-600">{meta.description}</p>
                <div key={step} className="animate-fade-in">
                  {renderStep()}
                </div>
              </>
            )}
          </div>
          {!confirmed && (
            <WizardNav
              canBack={step > 1}
              canNext={canNext}
              nextLabel={step === STEP_COUNT ? "Confirm booking" : "Continue"}
              pending={pending}
              hint={hint}
              onBack={() => go(step - 1)}
              onNext={() => (step === STEP_COUNT ? void confirm() : go(step + 1))}
            />
          )}
        </div>
        {!confirmed && <SummaryPanel state={state} derived={derived} />}
      </div>
    </div>
  );
}
