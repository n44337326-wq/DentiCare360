"use client";

import Link from "next/link";
import { useEffect, useRef, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { SpecialtyIcon } from "@/components/home/specialty-icon";
import { cn } from "@/lib/utils";
import "./service-finder.css";

export interface FinderItem {
  id: string;
  slug: string;
  name: string;
  icon: string;
  text: string;
}

const TONES = ["cyan", "green", "blue"] as const;
// Bento layout: the first and last card are wider, so the grid never reads as identical squares.
const WIDE = new Set([0, 5]);

/**
 * Bento grid of care areas. Cards reveal with a stagger when the section scrolls into view and
 * light up under the cursor. The reveal is armed from an effect (DOM attributes, no re-render),
 * so without JavaScript — or with reduced motion — every card is simply visible.
 */
export function FinderGrid({ header, items }: { header: ReactNode; items: FinderItem[] }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.dataset.armed = "true";
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.in = "true";
          observer.disconnect();
        }
      },
      { threshold: 0.18 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function onPointerMove(e: PointerEvent<HTMLUListElement>) {
    if (e.pointerType !== "mouse") return;
    const card = (e.target as HTMLElement).closest<HTMLElement>(".finder-card");
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - r.left}px`);
    card.style.setProperty("--my", `${e.clientY - r.top}px`);
  }

  return (
    <div ref={root} className="finder-grid">
      {header}
      <ul onPointerMove={onPointerMove} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((s, i) => (
          <li
            key={s.id}
            className={cn("finder-reveal", WIDE.has(i) && "sm:col-span-2")}
            style={{ "--d": `${150 + i * 90}ms` } as CSSProperties}
          >
            <Link
              href={`/doctors?specialty=${s.slug}`}
              data-tone={TONES[i % TONES.length]}
              className="finder-card group flex h-full min-h-[11.5rem] flex-col justify-between overflow-hidden rounded-[1.75rem] border border-border bg-white p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
            >
              <span aria-hidden="true" className="finder-watermark">
                <SpecialtyIcon name={s.icon} className="h-36 w-36" />
              </span>

              <div className="relative flex items-start gap-4">
                <span className="finder-icon relative flex h-14 w-14 shrink-0 items-center justify-center text-navy">
                  <span className="finder-blob absolute inset-0" />
                  <SpecialtyIcon name={s.icon} className="relative h-6 w-6" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-navy">{s.name}</h3>
                  <p className="mt-1 text-sm text-navy/70">{s.text}</p>
                </div>
              </div>

              <span className="relative mt-5 flex items-center justify-between text-sm font-medium text-navy">
                View doctors
                <span className="finder-arrow">
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
