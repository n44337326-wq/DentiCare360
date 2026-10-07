"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, Baby, CalendarCheck, Droplets, ShieldCheck, Smile, Sparkles, Stethoscope, type LucideIcon } from "lucide-react";
import { SPECIALTY_DETAILS } from "@/content/site-content";
import "./specialist-guide.css";

const ICONS: Record<string, LucideIcon> = {
  dental: Smile,
  dermatology: Droplets,
  "skin-face": Sparkles,
  general: Stethoscope,
  pediatric: Baby,
  preventive: ShieldCheck,
};

const TONES: [string, string][] = [
  ["#13a3b3", "#0b6f80"],
  ["#2f6fb5", "#1b4a82"],
  ["#0ea5b7", "#2f6fb5"],
  ["#143a63", "#2a6aa3"],
  ["#1d8fb0", "#13a3b3"],
  ["#17808f", "#0c3d5e"],
];

/** "Which specialist should I see?" — expanding panels: hover or tap one to see what it treats and what a first visit involves. */
export function SpecialistGuide({ specialties }: { specialties: { slug: string; name: string }[] }) {
  const items = specialties.filter((s) => SPECIALTY_DETAILS[s.slug]);
  const [active, setActive] = useState(0);
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="guide-heading" className="sx mt-16">
      <div className="mx-auto max-w-2xl text-center">
        <span className="sx-eyebrow">Specialist guide</span>
        <h2 id="guide-heading" className="mt-3 text-3xl font-black text-navy sm:text-4xl">
          Which specialist <span className="sx-title">should I see?</span>
        </h2>
        <p className="mt-3 text-navy/75">
          A quick guide to what each type of doctor helps with. Still unsure? The{" "}
          <Link href="/ai-assistant" className="font-bold text-cyan underline-offset-4 hover:underline">
            AI Health Assistant
          </Link>{" "}
          can suggest one — it never diagnoses.
        </p>
      </div>

      <div className="sx-row mt-10">
        {items.map((s, i) => {
          const d = SPECIALTY_DETAILS[s.slug];
          const Icon = ICONS[s.slug] ?? Stethoscope;
          const isActive = i === active;
          const [from, to] = TONES[i % TONES.length];
          return (
            <div
              key={s.slug}
              className="sx-panel"
              data-active={isActive}
              style={{ "--from": from, "--to": to, animationDelay: `${i * 90}ms` } as CSSProperties}
              onMouseEnter={() => setActive(i)}
            >
              <Icon className="sx-mark" strokeWidth={1} aria-hidden="true" />

              <button
                type="button"
                className="sx-face focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-expanded={isActive}
                aria-controls={`sx-content-${s.slug}`}
                onClick={() => setActive(i)}
              >
                <span className="sx-face-icon">
                  <Icon className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
                </span>
                <span className="sx-face-name">{s.name}</span>
              </button>

              <div id={`sx-content-${s.slug}`} className="sx-content" aria-hidden={!isActive}>
                <div className="sx-inner">
                  <h3 className="text-2xl font-black text-white">{s.name}</h3>
                  <p className="mt-1 text-sm text-white/80">{d.tagline}</p>

                  <p className="sx-label">Often seen for</p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {d.treats.map((t, n) => (
                      <li key={t} className="sx-tag" style={{ animationDelay: `${n * 50}ms` }}>
                        {t}
                      </li>
                    ))}
                  </ul>

                  <p className="sx-label">Your first visit</p>
                  <p className="sx-visit">
                    <CalendarCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {d.firstVisit}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2.5">
                    <Link href={`/doctors?specialty=${s.slug}`} tabIndex={isActive ? 0 : -1} className="sx-btn sx-btn-solid">
                      Show {s.name} doctors <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                    <Link href="/ai-assistant" tabIndex={isActive ? 0 : -1} className="sx-btn sx-btn-ghost">
                      <Sparkles className="h-4 w-4" aria-hidden="true" /> Ask AI
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
