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
      <ul onPointerMove={onPointerMove} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((s, i) => (
          <li key={s.id} className="finder-reveal" style={{ "--d": `${150 + i * 90}ms` } as CSSProperties}>
            <Link
              href={`/doctors?specialty=${s.slug}`}
              data-tone={TONES[i % TONES.length]}
              className="finder-card group relative flex flex-col overflow-hidden rounded-2xl transition-all duration-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
            >
              <div className="finder-card-header relative h-40 overflow-hidden transition-all duration-700">
                <div className="absolute inset-0 bg-gradient-to-br opacity-90 transition-all duration-700" />
                <span aria-hidden="true" className="absolute -right-6 -top-6 opacity-20 transition-all duration-700">
                  <SpecialtyIcon name={s.icon} className="h-56 w-56" />
                </span>
                <div className="relative z-10 flex h-full items-center justify-center">
                  <div className="finder-avatar-badge relative flex h-40 w-40 items-center justify-center transition-all duration-700">
                    <div className="finder-avatar-circle absolute inset-0 rounded-full" />
                    <div className="finder-avatar-emoji relative z-20 flex items-center justify-center text-9xl leading-tight">
                      {s.slug === "dental" && "🦷"}
                      {s.slug === "dermatology" && "💄"}
                      {s.slug === "skin-face" && "✨"}
                      {s.slug === "general" && "⚕️"}
                      {s.slug === "pediatric" && "👶"}
                      {s.slug === "preventive" && "🛡️"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative z-10 flex flex-1 flex-col justify-between bg-white p-6 transition-all duration-700">
                <div>
                  <h3 className="text-2xl font-black text-navy leading-tight">{s.name}</h3>
                  <p className="mt-3 text-sm text-navy/75 leading-relaxed">{s.text}</p>
                </div>

                <button className="finder-cta-btn mt-5 inline-flex items-center gap-2 rounded-full px-6 py-3 font-bold text-white transition-all duration-700">
                  <span>View Doctors</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
