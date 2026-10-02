"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  CalendarCheck,
  CalendarClock,
  HelpCircle,
  LockKeyhole,
  Sparkles,
  Stethoscope,
  Video,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { FaqItem } from "@/content/site-content";
import "./faq-tiles.css";

const FALLBACK_ICONS: LucideIcon[] = [HelpCircle, Stethoscope, Sparkles, Bot];

const KEYWORD_ICONS: [RegExp, LucideIcon][] = [
  [/private|privacy|secure|record|data/i, LockKeyhole],
  [/cost|price|fee|pay|insurance/i, Wallet],
  [/online|video|remote/i, Video],
  [/cancel|change|reschedul|unavailable|away/i, CalendarClock],
  [/book|appointment|schedule|long|last/i, CalendarCheck],
  [/\bAI\b|assistant/i, Bot],
];

function iconFor(question: string, index: number) {
  return KEYWORD_ICONS.find(([re]) => re.test(question))?.[1] ?? FALLBACK_ICONS[index % FALLBACK_ICONS.length];
}

const AUTO_MS = 7000;

/** Question tiles on the left, a large animated answer panel on the right; auto-advances, pauses on hover. */
export function FaqTiles({
  items,
  title = "Frequently asked questions",
  description,
  id = "faq",
}: {
  items: FaqItem[];
  title?: string;
  description?: string;
  id?: string;
}) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(() => setActive((a) => (a + 1) % items.length), AUTO_MS);
    return () => clearTimeout(timer);
  }, [active, paused, items.length]);

  const current = items[active];
  const CurrentIcon = iconFor(current.q, active);

  return (
    <section aria-labelledby={`${id}-heading`} className="ft-wrap isolate mx-auto max-w-6xl">
      <span aria-hidden="true" className="ft-blob ft-blob-a" />
      <span aria-hidden="true" className="ft-blob ft-blob-b" />

      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-cyan/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-cyan">
          <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" /> FAQ
        </span>
        <h2 id={`${id}-heading`} className="mt-4 text-3xl font-black leading-tight text-navy sm:text-4xl">
          {title}
        </h2>
        <span aria-hidden="true" className="ft-line" />
        {description && <p className="mt-4 text-navy/70">{description}</p>}
      </div>

      <div
        className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div role="tablist" aria-label={title} className="grid content-start gap-3 sm:grid-cols-2">
          {items.map((item, i) => {
            const Icon = iconFor(item.q, i);
            return (
              <button
                key={item.q}
                type="button"
                role="tab"
                aria-selected={i === active}
                onClick={() => setActive(i)}
                onPointerMove={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
                  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
                }}
                className="ft-tile focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <span className="ft-tile-icon">
                  <Icon className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
                </span>
                <span className="ft-tile-q">{item.q}</span>
                <span className="ft-tile-arrow">
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </button>
            );
          })}
        </div>

        <div className="ft-panel" aria-live="polite">
          <span key={`bar-${active}-${paused}`} className="ft-bar" style={{ animationPlayState: paused ? "paused" : "running" }} />
          <span aria-hidden="true" className="ft-panel-ring ft-panel-ring-1" />
          <span aria-hidden="true" className="ft-panel-ring ft-panel-ring-2" />
          <CurrentIcon aria-hidden="true" className="ft-panel-mark" strokeWidth={1.2} />
          {[8, 22, 38, 54, 70, 86].map((left, n) => (
            <span key={left} aria-hidden="true" className="ft-particle" style={{ left: `${left}%`, animationDelay: `${n * 1.3}s` }} />
          ))}

          <div key={active} className="ft-panel-body">
            <span className="ft-panel-icon">
              <CurrentIcon className="h-7 w-7" strokeWidth={1.8} aria-hidden="true" />
            </span>
            <h3 className="ft-rise-in mt-4 text-xl font-black leading-snug text-navy sm:text-2xl">{current.q}</h3>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-navy/75 sm:text-base">
              {current.a.split(" ").map((word, n) => (
                <span key={n} className="ft-word" style={{ animationDelay: `${250 + n * 28}ms` }}>
                  {word}{" "}
                </span>
              ))}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link href="/contact" className="ft-btn ft-btn-solid ft-pop" style={{ animationDelay: "0.7s" }}>
                Contact us <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/ai-assistant" className="ft-btn ft-btn-ghost ft-pop" style={{ animationDelay: "0.85s" }}>
                <Sparkles className="h-4 w-4 text-cyan" aria-hidden="true" /> Ask the AI Assistant
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
