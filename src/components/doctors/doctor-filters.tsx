"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { FilterX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { FILTER_KEYS } from "@/components/doctors/doctor-search";

interface Option {
  value: string;
  label: string;
}

const AVAILABILITY: Option[] = [{ value: "now", label: "Available within 7 days" }];
const EXPERIENCE: Option[] = [
  { value: "5", label: "5+ years" },
  { value: "10", label: "10+ years" },
  { value: "15", label: "15+ years" },
];
const CONSULTATION: Option[] = [
  { value: "in-person", label: "In-person" },
  { value: "online", label: "Online" },
];

const SELECT_CLASS =
  "h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan disabled:opacity-60";

function FilterSelect({
  id,
  label,
  anyLabel,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  anyLabel: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select id={id} className={SELECT_CLASS} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{anyLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Filter bar for /doctors. State lives in the URL so results are shareable and rendered on the server. */
export function DoctorFilters({
  specialties,
  locations,
  languages,
  resultCount,
  totalCount,
}: {
  specialties: Option[];
  locations: string[];
  languages: string[];
  resultCount: number;
  totalCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const active = FILTER_KEYS.filter((k) => params.get(k));
  const get = (key: string) => params.get(key) ?? "";

  function navigate(next: URLSearchParams) {
    const qs = next.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    navigate(next);
  }

  function clearAll() {
    const next = new URLSearchParams(params.toString());
    FILTER_KEYS.forEach((k) => next.delete(k));
    navigate(next);
  }

  return (
    <section aria-label="Filter doctors" className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <FilterSelect
          id="filter-specialty"
          label="Specialty"
          anyLabel="All specialties"
          value={get("specialty")}
          options={specialties}
          onChange={(v) => setParam("specialty", v)}
        />
        <FilterSelect
          id="filter-available"
          label="Availability"
          anyLabel="Any time"
          value={get("available")}
          options={AVAILABILITY}
          onChange={(v) => setParam("available", v)}
        />
        <FilterSelect
          id="filter-experience"
          label="Experience"
          anyLabel="Any experience"
          value={get("minExperience")}
          options={EXPERIENCE}
          onChange={(v) => setParam("minExperience", v)}
        />
        <FilterSelect
          id="filter-consultation"
          label="Consultation type"
          anyLabel="Any type"
          value={get("consultation")}
          options={CONSULTATION}
          onChange={(v) => setParam("consultation", v)}
        />
        <FilterSelect
          id="filter-location"
          label="Location"
          anyLabel="All locations"
          value={get("location")}
          options={locations.map((l) => ({ value: l, label: l }))}
          onChange={(v) => setParam("location", v)}
        />
        <FilterSelect
          id="filter-language"
          label="Language"
          anyLabel="Any language"
          value={get("language")}
          options={languages.map((l) => ({ value: l, label: l }))}
          onChange={(v) => setParam("language", v)}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p
          role="status"
          aria-live="polite"
          className={cn("text-sm text-navy transition-opacity", pending && "opacity-60")}
        >
          {pending
            ? "Updating results…"
            : `Showing ${resultCount} of ${totalCount} ${totalCount === 1 ? "doctor" : "doctors"}`}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={clearAll} disabled={active.length === 0}>
          <FilterX aria-hidden="true" /> Clear filters
        </Button>
      </div>
    </section>
  );
}
