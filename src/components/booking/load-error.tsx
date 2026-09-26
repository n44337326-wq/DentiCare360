"use client";

import { useRouter } from "next/navigation";
import { ErrorState } from "@/components/shared/states";

/** Shown by the booking page when its data could not be loaded. */
export function BookingLoadError() {
  const router = useRouter();
  return (
    <ErrorState
      message="We couldn't load the booking options. Please try again."
      onRetry={() => router.refresh()}
    />
  );
}
