import type { BookingState } from "@/components/booking/booking-state";
import type { BookingDoctor } from "@/components/booking/types";
import type { Service } from "@/types";

/** The booking page URL that restores the current selections (used as the sign-in callback). */
export function bookingReturnUrl(state: BookingState, service: Service | null, doctor: BookingDoctor | null): string {
  const params = new URLSearchParams();
  if (service) params.set("service", service.slug);
  else if (state.specialtySlug) params.set("specialty", state.specialtySlug);
  if (doctor) {
    params.set("doctor", doctor.id);
    if (state.date) params.set("date", state.date);
    if (state.date && state.startTime) params.set("time", state.startTime);
  }
  if (state.conversationId) params.set("conversation", state.conversationId);
  const qs = params.toString();
  return qs ? `/appointments/book?${qs}` : "/appointments/book";
}

export function authUrl(path: "/login" | "/register", returnUrl: string): string {
  return `${path}?callbackUrl=${encodeURIComponent(returnUrl)}`;
}
