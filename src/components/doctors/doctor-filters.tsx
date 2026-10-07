"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition, type KeyboardEvent } from "react";
import {
  Award,
  Building2,
  CalendarClock,
  Check,
  ChevronDown,
  FilterX,
  Languages,
  MapPin,
  Monitor,
  SlidersHorizontal,
  Stethoscope,
  Video,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FILTER_KEYS } from "@/components/doctors/doctor-search";
import "./doctor-filters.css";

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

/** Custom listbox dropdown: icon tile, small label, bold value, animated menu with check marks. */
function FilterDropdown({
  id,
  label,
  icon: Icon,
  anyLabel,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  icon: LucideIcon;
  anyLabel: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();
  const all: Option[] = [{ value: "", label: anyLabel }, ...options];
  const selected = all.find((o) => o.value === value) ?? all[0];
  const isSet = value !== "";

  useEffect(() => {
    if (!open) return;
    const onDown = (e: globalThis.PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  function openMenu() {
    setHighlight(Math.max(0, all.findIndex((o) => o.value === value)));
    setOpen(true);
  }

  function choose(v: string) {
    onChange(v);
    setOpen(false);
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) return openMenu();
      setHighlight((h) => (e.key === "ArrowDown" ? (h + 1) % all.length : (h - 1 + all.length) % all.length));
    }
    if (e.key === "Home" && open) {
      e.preventDefault();
      setHighlight(0);
    }
    if (e.key === "End" && open) {
      e.preventDefault();
      setHighlight(all.length - 1);
    }
    if ((e.key === "Enter" || e.key === " ") && open) {
      e.preventDefault();
      choose(all[highlight].value);
    }
  }

  return (
    <div ref={root} className="dd-field" data-open={open} data-set={isSet}>
      <button
        type="button"
        id={id}
        className="dd-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
      >
        <span className="dd-icon">
          <Icon className="h-4.5 w-4.5" strokeWidth={1.9} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1 text-left leading-tight">
          <span className="dd-label">{label}</span>
          <span className="dd-value">{selected.label}</span>
        </span>
        <ChevronDown className="dd-chevron h-4 w-4" aria-hidden="true" />
      </button>

      <ul id={listId} role="listbox" aria-label={label} className="dd-menu" data-open={open}>
        {all.map((o, i) => (
          <li
            key={o.value || "any"}
            role="option"
            aria-selected={o.value === value}
            data-highlight={i === highlight}
            className="dd-option"
            style={{ transitionDelay: open ? `${i * 25}ms` : "0ms" }}
            onMouseEnter={() => setHighlight(i)}
            onClick={() => choose(o.value)}
          >
            <span className="flex-1">{o.label}</span>
            {o.value === value && <Check className="h-4 w-4 text-cyan" aria-hidden="true" />}
          </li>
        ))}
      </ul>
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

  function toggleParam(key: string, value: string) {
    setParam(key, get(key) === value ? "" : value);
  }

  function clearAll() {
    const next = new URLSearchParams(params.toString());
    FILTER_KEYS.forEach((k) => next.delete(k));
    navigate(next);
  }

  const chips: { key: string; label: string }[] = [];
  const push = (key: string, label?: string) => {
    if (get(key) && label) chips.push({ key, label });
  };
  push("specialty", specialties.find((s) => s.value === get("specialty"))?.label);
  push("available", AVAILABILITY.find((o) => o.value === get("available"))?.label);
  push("minExperience", EXPERIENCE.find((o) => o.value === get("minExperience"))?.label);
  push("consultation", CONSULTATION.find((o) => o.value === get("consultation"))?.label);
  push("location", get("location"));
  push("language", get("language"));

  const quick = [
    { key: "available", value: "now", label: "Available this week", icon: Zap },
    { key: "consultation", value: "online", label: "Online visit", icon: Monitor },
    { key: "consultation", value: "in-person", label: "In-person", icon: Building2 },
  ];

  return (
    <section aria-label="Filter doctors" className="df" data-pending={pending}>
      <span className="df-bar" aria-hidden="true" />
      <span className="df-glow df-glow-a" aria-hidden="true" />
      <span className="df-glow df-glow-b" aria-hidden="true" />

      <div className="df-head">
        <span className="df-head-icon">
          <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="leading-tight">
          <h2 className="text-lg font-black text-navy">Refine your search</h2>
          <p className="text-xs text-navy/60">Pick filters below — the list updates instantly</p>
        </div>

        <div className="df-quick" role="group" aria-label="Quick filters">
          {quick.map((q) => (
            <button
              key={q.label}
              type="button"
              className="df-pill"
              aria-pressed={get(q.key) === q.value}
              onClick={() => toggleParam(q.key, q.value)}
            >
              <q.icon className="h-3.5 w-3.5" aria-hidden="true" /> {q.label}
            </button>
          ))}
        </div>
      </div>

      <div className="df-grid">
        <FilterDropdown
          id="filter-specialty"
          label="Specialty"
          icon={Stethoscope}
          anyLabel="All specialties"
          value={get("specialty")}
          options={specialties}
          onChange={(v) => setParam("specialty", v)}
        />
        <FilterDropdown
          id="filter-available"
          label="Availability"
          icon={CalendarClock}
          anyLabel="Any time"
          value={get("available")}
          options={AVAILABILITY}
          onChange={(v) => setParam("available", v)}
        />
        <FilterDropdown
          id="filter-experience"
          label="Experience"
          icon={Award}
          anyLabel="Any experience"
          value={get("minExperience")}
          options={EXPERIENCE}
          onChange={(v) => setParam("minExperience", v)}
        />
        <FilterDropdown
          id="filter-consultation"
          label="Consultation"
          icon={Video}
          anyLabel="Any type"
          value={get("consultation")}
          options={CONSULTATION}
          onChange={(v) => setParam("consultation", v)}
        />
        <FilterDropdown
          id="filter-location"
          label="Location"
          icon={MapPin}
          anyLabel="All locations"
          value={get("location")}
          options={locations.map((l) => ({ value: l, label: l }))}
          onChange={(v) => setParam("location", v)}
        />
        <FilterDropdown
          id="filter-language"
          label="Language"
          icon={Languages}
          anyLabel="Any language"
          value={get("language")}
          options={languages.map((l) => ({ value: l, label: l }))}
          onChange={(v) => setParam("language", v)}
        />
      </div>

      <div className="df-foot">
        <p role="status" aria-live="polite" className={cn("df-count", pending && "opacity-60")}>
          {pending ? (
            "Updating results…"
          ) : (
            <>
              Showing <strong key={resultCount} className="df-num">{resultCount}</strong> of {totalCount}{" "}
              {totalCount === 1 ? "doctor" : "doctors"}
            </>
          )}
        </p>

        <div className="df-chips">
          {chips.map((c) => (
            <button key={c.key} type="button" className="df-chip" onClick={() => setParam(c.key, "")} aria-label={`Remove filter ${c.label}`}>
              {c.label} <X className="h-3 w-3" aria-hidden="true" />
            </button>
          ))}
        </div>

        <button type="button" onClick={clearAll} disabled={active.length === 0} className="df-clear">
          <FilterX className="h-4 w-4" aria-hidden="true" /> Clear filters
        </button>
      </div>
    </section>
  );
}
