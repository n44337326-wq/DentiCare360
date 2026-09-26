import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatShortDate } from "@/lib/time";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

/** "2026-09-21" → "Mon, Sep 21". Takes a clinic-calendar date string, never a Date, so it can't shift with timezones. */
export const formatDate = formatShortDate;

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
