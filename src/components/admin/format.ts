import { CLINIC_TIMEZONE, formatShortDate } from "@/lib/time";

/** ISO instant → "Sep 19, 3:42 PM" in the clinic timezone (never the viewer's or server's). */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: CLINIC_TIMEZONE,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** ISO instant → "Sep 19, 2026" in the clinic timezone. */
export function formatInstantDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    timeZone: CLINIC_TIMEZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** "2026-09-21" → "Mon 21": compact label under a chart column. */
export function chartDayLabel(dateISO: string): string {
  const [weekday, rest = ""] = formatShortDate(dateISO).split(", ");
  return `${weekday} ${rest.split(" ")[1] ?? ""}`.trim();
}
