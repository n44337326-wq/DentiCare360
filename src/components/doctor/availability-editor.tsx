"use client";

import { useCallback, useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw, Save } from "lucide-react";
import type { Doctor } from "@/types";
import { apiFetch } from "@/lib/api-client";
import { useAsyncAction } from "@/hooks/use-async-action";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/shared/states";
import {
  stateFromDoctor,
  validateSchedule,
  type ScheduleErrors,
  type ScheduleState,
} from "@/components/doctor/availability-model";
import { BlockedDatesEditor } from "@/components/doctor/blocked-dates-editor";
import { ConsultationSettings } from "@/components/doctor/consultation-settings";
import { TemporaryUnavailability } from "@/components/doctor/temporary-unavailability";
import { WeeklyHoursEditor } from "@/components/doctor/weekly-hours-editor";

interface ScheduleResponse {
  doctor: Doctor;
  affectedAppointments: number;
}

/**
 * Full schedule editor for one doctor. Used by the doctor (own schedule) and by
 * admins (`/admin/doctors/[id]/schedule`) — the API authorises both.
 */
export function AvailabilityEditor({
  doctorId,
  initialDoctor,
  appointmentsHref = "/doctor/appointments",
}: {
  doctorId: string;
  initialDoctor: Doctor;
  /** Where "reschedule them" points: doctors go to their list, admins to the admin list. */
  appointmentsHref?: string;
}) {
  const router = useRouter();
  const idPrefix = useId();
  const [state, setState] = useState<ScheduleState>(() => stateFromDoctor(initialDoctor));
  const [baseline, setBaseline] = useState(() => JSON.stringify(stateFromDoctor(initialDoctor)));
  const [errors, setErrors] = useState<ScheduleErrors>({});
  const [affected, setAffected] = useState<number | null>(null);

  const save = useCallback(
    (payload: unknown) => apiFetch<ScheduleResponse>(`/api/doctors/${doctorId}/schedule`, { method: "PUT", json: payload }),
    [doctorId]
  );
  const { run, pending, error, succeeded, reset } = useAsyncAction(save);

  const dirty = JSON.stringify(state) !== baseline;
  const patch = (p: Partial<ScheduleState>) => {
    setState((s) => ({ ...s, ...p }));
    setErrors({});
    reset();
  };

  async function onSave() {
    const result = validateSchedule(state);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    const res = await run(result.payload);
    if (res) {
      const next = stateFromDoctor(res.doctor);
      setState(next);
      setBaseline(JSON.stringify(next));
      setAffected(res.affectedAppointments);
      router.refresh();
    }
  }

  function onDiscard() {
    const initial = JSON.parse(baseline) as ScheduleState;
    setState(initial);
    setErrors({});
    reset();
  }

  const errorList = Object.entries(errors);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void onSave();
      }}
      noValidate
      className="space-y-6"
    >
      {succeeded && !dirty && (
        <InlineAlert variant="success" title="Schedule saved">
          Patients now see your updated availability.
        </InlineAlert>
      )}
      {succeeded && !dirty && affected !== null && affected > 0 && (
        <InlineAlert variant="warning">
          {affected} upcoming appointment{affected === 1 ? " is" : "s are"} affected. Those patients were notified — please{" "}
          <Link href={appointmentsHref} className="font-medium underline">
            reschedule them
          </Link>
          .
        </InlineAlert>
      )}
      {error && <InlineAlert variant="error" title="We couldn't save your schedule">{error}</InlineAlert>}
      {errorList.length > 0 && (
        <InlineAlert variant="error" title="Please fix the highlighted fields">
          {errors.form ?? "Check your working hours, breaks and consultation settings below."}
        </InlineAlert>
      )}

      <TemporaryUnavailability
        idPrefix={idPrefix}
        value={state.isTemporarilyUnavailable}
        reason={state.unavailableReason}
        error={errors.reason}
        onChange={patch}
      />
      <WeeklyHoursEditor idPrefix={idPrefix} days={state.days} errors={errors} onChange={(days) => patch({ days })} />
      <BlockedDatesEditor
        idPrefix={idPrefix}
        value={state.blockedDates}
        error={errors.blocked}
        onChange={(blockedDates) => patch({ blockedDates })}
      />
      <ConsultationSettings
        supportsOnline={state.supportsOnline}
        supportsInPerson={state.supportsInPerson}
        autoConfirm={state.autoConfirm}
        error={errors.consultation}
        onChange={patch}
      />

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3 shadow-lg">
        <p className="text-sm text-slate-700" aria-live="polite">
          {pending ? "Saving your schedule…" : dirty ? "You have unsaved changes." : "All changes saved."}
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onDiscard} disabled={!dirty || pending}>
            <RotateCcw aria-hidden="true" /> Discard
          </Button>
          <Button type="submit" disabled={!dirty || pending} aria-busy={pending}>
            {pending ? <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Save aria-hidden="true" />}
            {pending ? "Saving…" : "Save schedule"}
          </Button>
        </div>
      </div>
    </form>
  );
}
