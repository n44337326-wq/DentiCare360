import type { NextAvailable } from "@/lib/availability";
import { addDays } from "@/lib/time";
import type { Doctor } from "@/types";

/** Doctor-discovery filters, as carried in the /doctors query string. */
export interface DoctorFilterValues {
  specialty?: string;
  available?: "now";
  minExperience?: 5 | 10 | 15;
  consultation?: "online" | "in-person";
  location?: string;
  language?: string;
}

export const FILTER_KEYS = ["specialty", "available", "minExperience", "consultation", "location", "language"] as const;

type RawParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

/** Reads the raw query string defensively — anything unrecognised is ignored. */
export function parseDoctorFilters(sp: RawParams): DoctorFilterValues {
  const minExperience = Number(first(sp.minExperience));
  const consultation = first(sp.consultation);
  return {
    specialty: first(sp.specialty),
    available: first(sp.available) === "now" ? "now" : undefined,
    minExperience: minExperience === 5 || minExperience === 10 || minExperience === 15 ? minExperience : undefined,
    consultation: consultation === "online" || consultation === "in-person" ? consultation : undefined,
    location: first(sp.location),
    language: first(sp.language),
  };
}

export function hasActiveFilters(filters: DoctorFilterValues) {
  return FILTER_KEYS.some((k) => filters[k] !== undefined);
}

/** Doctors with an opening in the next 7 days, and not temporarily unavailable. */
export function isAvailableSoon(doctor: Doctor, next: NextAvailable | null | undefined, today: string) {
  return !doctor.isTemporarilyUnavailable && !!next && next.date <= addDays(today, 7);
}

export function filterDoctors(
  doctors: Doctor[],
  nextByDoctor: ReadonlyMap<string, NextAvailable | null>,
  filters: DoctorFilterValues,
  today: string
): Doctor[] {
  return doctors.filter((d) => {
    if (filters.specialty && d.specialtySlug !== filters.specialty) return false;
    if (filters.available === "now" && !isAvailableSoon(d, nextByDoctor.get(d.id), today)) return false;
    if (filters.minExperience && d.experienceYears < filters.minExperience) return false;
    if (filters.consultation === "online" && !d.supportsOnline) return false;
    if (filters.consultation === "in-person" && !d.supportsInPerson) return false;
    if (filters.location && d.location !== filters.location) return false;
    if (filters.language && !d.languages.includes(filters.language)) return false;
    return true;
  });
}

/** Location and language choices come from the data, so they never drift from what doctors actually list. */
export function deriveFilterOptions(doctors: Doctor[]) {
  const sorted = (values: Iterable<string>) => [...new Set(values)].filter(Boolean).sort((a, b) => a.localeCompare(b));
  return {
    locations: sorted(doctors.map((d) => d.location)),
    languages: sorted(doctors.flatMap((d) => d.languages)),
  };
}
