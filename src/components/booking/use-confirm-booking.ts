"use client";

import { useCallback, useRef, useState, type Dispatch } from "react";
import { ApiError, apiFetch, errorMessage } from "@/lib/api-client";
import type { Appointment } from "@/types";
import type { BookingAction, BookingDerived, BookingState } from "@/components/booking/booking-state";

/** Submits the booking. Guards against double submits and maps API errors to the right recovery. */
export function useConfirmBooking(state: BookingState, derived: BookingDerived, dispatch: Dispatch<BookingAction>) {
  const inFlight = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const confirm = useCallback(async () => {
    const { service, doctor } = derived;
    if (inFlight.current || !service || !doctor || !state.date || !state.startTime || !state.consultationType) return;
    inFlight.current = true;
    setPending(true);
    setError(null);
    try {
      const notes = state.notes.trim();
      const res = await apiFetch<{ appointment: Appointment }>("/api/appointments", {
        method: "POST",
        json: {
          doctorId: doctor.id,
          serviceId: service.id,
          date: state.date,
          startTime: state.startTime,
          consultationType: state.consultationType,
          patientName: derived.patientName.trim(),
          ...(notes ? { notes } : {}),
          ...(state.conversationId ? { aiConversationId: state.conversationId } : {}),
        },
      });
      dispatch({ type: "confirmed", appointment: res.appointment });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409 && err.code === "SLOT_UNAVAILABLE") {
        dispatch({
          type: "slotTaken",
          message: "That time was just taken by someone else. Please choose another available time.",
        });
      } else if (err instanceof ApiError && err.status === 429) {
        setError("You're doing that a little too quickly. Please wait a moment and try again.");
      } else if (err instanceof ApiError && err.status === 0) {
        setError("We couldn't reach the server. Check your connection and try again — your selections are saved.");
      } else if (err instanceof ApiError && err.status === 401) {
        setError("Your session has expired. Please sign in again to finish booking.");
      } else {
        setError(errorMessage(err));
      }
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }, [derived, state, dispatch]);

  return { confirm, pending, error, clearError };
}
