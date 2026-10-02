"use client";

import { useEffect, useState } from "react";
import { HeartPulse, Smile, Sparkles, Stethoscope, type LucideIcon } from "lucide-react";
import "./services.css";

const ICONS: Record<string, LucideIcon> = {
  dental: Smile,
  dermatology: Sparkles,
  general: HeartPulse,
};

/** Sticky segmented control; a gradient thumb slides to the category currently on screen. */
export function ServicesNav({ groups }: { groups: { id: string; label: string; count: number }[] }) {
  const [active, setActive] = useState(groups[0]?.id);

  useEffect(() => {
    const sections = groups
      .map((g) => document.getElementById(g.id))
      .filter((el): el is HTMLElement => el !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-25% 0px -60% 0px" },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [groups]);

  const index = Math.max(0, groups.findIndex((g) => g.id === active));

  return (
    <nav
      aria-label="Service categories"
      className="sticky top-16 z-30 -mx-5 mb-10 border-y border-border bg-white/90 px-5 py-3 backdrop-blur-md"
    >
      <ul className="svc-seg mx-auto max-w-3xl" style={{ gridTemplateColumns: `repeat(${groups.length}, minmax(0, 1fr))` }}>
        <li
          aria-hidden="true"
          className="svc-seg-thumb"
          style={{ width: `calc((100% - 0.6rem) / ${groups.length})`, transform: `translateX(${index * 100}%)` }}
        />
        {groups.map((g) => {
          const Icon = ICONS[g.id] ?? Stethoscope;
          return (
            <li key={g.id} className="contents">
              <a
                href={`#${g.id}`}
                aria-current={g.id === active}
                onClick={() => setActive(g.id)}
                className="svc-seg-item focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{g.label}</span>
                <span className="svc-count hidden sm:inline">{g.count}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
