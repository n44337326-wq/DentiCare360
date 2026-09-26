import { CLINIC_TIMEZONE } from "@/lib/time";

export type Loaded<T> = { ok: true; data: T } | { ok: false; message: string };

/** Runs a server-side data load so one failing section shows an error state instead of crashing the page. */
export async function loadSafe<T>(what: string, fn: () => Promise<T>): Promise<Loaded<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (err) {
    console.error(`[patient portal] failed to load ${what}`, err);
    return { ok: false, message: `We couldn't load your ${what} right now. Please refresh the page or try again shortly.` };
  }
}

/** Formats a stored instant (ISO timestamp) as a clinic-timezone calendar date. Use in server components only. */
export function formatInstantDate(iso: string | Date): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: CLINIC_TIMEZONE,
  });
}
