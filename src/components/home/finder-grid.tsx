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
      <ul onPointerMove={onPointerMove} className="mx-auto grid max-w-4xl gap-4 px-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((s, i) => (
          <li key={s.id} className="finder-reveal h-full" style={{ "--d": `${150 + i * 90}ms` } as CSSProperties}>
            <Link
              href={`/doctors?specialty=${s.slug}`}
              data-tone={TONES[i % TONES.length]}
              className="finder-card group relative flex h-full flex-col overflow-hidden rounded-2xl transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
            >
              {/* Card Background - White with subtle shadow */}
              <div className="absolute inset-0 bg-white transition-all duration-500" />

              {/* Colored Top Bar */}
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br transition-all duration-700 group-hover:h-28" />

              {/* Card Content */}
              <div className="relative z-10 flex flex-col h-full w-full pt-4 px-4 pb-4">
                {/* Avatar - Positioned on top bar */}
                <div className="flex justify-center mb-2">
                  <div className="finder-avatar-badge relative flex h-16 w-16 items-center justify-center transition-all duration-500 transform group-hover:scale-110">
                    <div className="finder-avatar-circle absolute inset-0 rounded-full" />
                    <div className="finder-avatar-emoji relative z-20 flex items-center justify-center text-4xl leading-tight">
                      {s.slug === "dental" && "🦷"}
                      {s.slug === "dermatology" && "💄"}
                      {s.slug === "skin-face" && "✨"}
                      {s.slug === "general" && "⚕️"}
                      {s.slug === "pediatric" && "👶"}
                      {s.slug === "preventive" && "🛡️"}
                    </div>
                  </div>
                </div>

                {/* Title & Description - Dark text on white */}
                <div className="flex-1 text-center mb-3">
                  <h3 className="text-base font-black text-navy leading-tight mb-1">{s.name}</h3>
                  <p className="text-xs text-navy/65 leading-relaxed">{s.text}</p>
                </div>

                {/* CTA Button - Full Width */}
                <button className="finder-cta-btn w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-500">
                  <span>View Doctors</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
