"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { useAsyncAction } from "@/hooks/use-async-action";

export type AppointmentActionBody =
  | { action: "accept" }
  | { action: "no_show" }
  | { action: "cancel"; reason?: string }
  | { action: "complete"; doctorNotes?: string }
  | { action: "note"; doctorNotes: string }
  | { action: "reschedule"; date: string; startTime: string };

/**
 * PATCHes a lifecycle action for one appointment and re-syncs the server data
 * on success. Exposes pending / error / success so callers can show feedback.
 */
export function useAppointmentAction(appointmentId: string, onSuccess?: () => void) {
  const router = useRouter();
  const send = useCallback(
    async (body: AppointmentActionBody) => {
      await apiFetch(`/api/appointments/${appointmentId}`, { method: "PATCH", json: body });
      return true as const;
    },
    [appointmentId]
  );
  const { run, ...state } = useAsyncAction(send);

  const perform = useCallback(
    async (body: AppointmentActionBody) => {
      const ok = await run(body);
      if (ok) {
        onSuccess?.();
        router.refresh();
      }
      return !!ok;
    },
    [run, onSuccess, router]
  );

  return { perform, ...state };
}
