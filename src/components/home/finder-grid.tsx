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
      <ul onPointerMove={onPointerMove} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 px-2">
        {items.map((s, i) => (
          <li key={s.id} className="finder-reveal" style={{ "--d": `${150 + i * 90}ms` } as CSSProperties}>
            <Link
              href={`/doctors?specialty=${s.slug}`}
              data-tone={TONES[i % TONES.length]}
              className="finder-card group relative flex flex-col overflow-hidden rounded-3xl transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
            >
              {/* Animated Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br transition-all duration-700 opacity-100" />

              {/* Decorative Top Element */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent" />

              {/* Card Content */}
              <div className="relative z-10 flex flex-col h-full p-8">
                {/* Avatar Section - Large and Prominent */}
                <div className="finder-avatar-wrapper mb-6">
                  <div className="finder-avatar-badge relative flex h-32 w-32 mx-auto items-center justify-center transition-all duration-700 transform group-hover:scale-110">
                    <div className="finder-avatar-circle absolute inset-0 rounded-full group-hover:shadow-2xl transition-all duration-500" />
                    <div className="finder-avatar-emoji relative z-20 flex items-center justify-center text-7xl leading-tight group-hover:scale-125 transition-all duration-500">
                      {s.slug === "dental" && "🦷"}
                      {s.slug === "dermatology" && "💄"}
                      {s.slug === "skin-face" && "✨"}
                      {s.slug === "general" && "⚕️"}
                      {s.slug === "pediatric" && "👶"}
                      {s.slug === "preventive" && "🛡️"}
                    </div>
                  </div>
                </div>

                {/* Title & Description */}
                <div className="flex-1 text-center mb-6">
                  <h3 className="text-2xl font-black text-white leading-tight mb-3 drop-shadow-lg">{s.name}</h3>
                  <p className="text-sm text-white/90 leading-relaxed drop-shadow-md">{s.text}</p>
                </div>

                {/* Divider */}
                <div className="h-px bg-white/20 mb-6" />

                {/* Button - Styled to Match Card */}
                <button className="finder-cta-btn mx-auto inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold transition-all duration-500 transform group-hover:scale-105">
                  <span>View Doctors</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
