"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { useAsyncAction } from "@/hooks/use-async-action";

export interface DoctorPatch {
  consultationFee?: number;
  isActive?: boolean;
  isTemporarilyUnavailable?: boolean;
  unavailableReason?: string;
}

/** PATCH /api/admin/doctors/:id with pending / error state; refreshes server data on success. */
export function useDoctorPatch(doctorId: string, onDone?: () => void) {
  const router = useRouter();
  const send = useCallback(
    async (body: DoctorPatch) => {
      await apiFetch(`/api/admin/doctors/${doctorId}`, { method: "PATCH", json: body });
      return true as const;
    },
    [doctorId]
  );
  const { run, ...state } = useAsyncAction(send);

  const patch = useCallback(
    async (body: DoctorPatch) => {
      const ok = await run(body);
      if (ok) {
        onDone?.();
        router.refresh();
      }
      return !!ok;
    },
    [run, onDone, router]
  );
  return { patch, ...state };
}
