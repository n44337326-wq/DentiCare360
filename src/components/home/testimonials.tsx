"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import "./testimonials.css";

const TESTIMONIALS = [
  {
    name: "Priya S.",
    role: "Patient since 2024",
    quote:
      "I booked a dental cleaning and a skin consultation in the same afternoon, without visiting two different sites. It just worked.",
    rating: 5,
  },
  {
    name: "David M.",
    role: "Patient since 2023",
    quote:
      "The AI Assistant helped me work out that I needed a dermatologist, not a pharmacy run. It never tried to diagnose me. It just pointed me the right way.",
    rating: 5,
  },
  {
    name: "Fatima A.",
    role: "Patient since 2025",
    quote:
      "Rescheduling my son's pediatric appointment took less than a minute from my phone. A huge relief on a busy week.",
    rating: 4,
  },
];

const DURATION = 7000;

export function Testimonials() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(() => setActive((a) => (a + 1) % TESTIMONIALS.length), DURATION);
    return () => clearTimeout(timer);
  }, [active, paused]);

  const current = TESTIMONIALS[active];

  return (
    <section
      aria-labelledby="testimonials-heading"
      className="relative overflow-hidden bg-soft-blue py-16"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-cyan/15 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-navy/10 blur-3xl" />

      <div className={`container-app relative grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-16 ${paused ? "tm-paused" : ""}`}>
        <div>
          <p className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-medium text-navy shadow-sm">
            Demo testimonials &mdash; fictional patients
          </p>
          <h2 id="testimonials-heading" className="mt-4 text-3xl font-black text-navy sm:text-4xl">
            What patients{" "}
            <span className="bg-gradient-to-r from-cyan to-navy-light bg-clip-text text-transparent">say</span>
          </h2>

          <div
            role="tablist"
            aria-label="Choose a testimonial"
            className="mt-6"
            style={{ "--tm-duration": `${DURATION}ms` } as React.CSSProperties}
          >
            {TESTIMONIALS.map((t, i) => (
              <button
                key={t.name}
                type="button"
                role="tab"
                aria-selected={i === active}
                data-active={i === active}
                onClick={() => setActive(i)}
                className={`tm-tab ${i === active ? "opacity-100" : "opacity-50 hover:opacity-100"}`}
              >
                <span className="tm-bar" aria-hidden="true">
                  <span className="tm-fill" />
                </span>
                <span className="tm-avatar flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan to-navy-light text-sm font-bold text-white">
                  {t.name[0]}
                </span>
                <span className="leading-tight">
                  <span className="block text-sm font-bold text-navy">{t.name}</span>
                  <span className="block text-xs text-navy/70">{t.role}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <figure key={active} className="tm-slide relative min-h-[14rem] pt-6" aria-live="polite">
          <span aria-hidden="true" className="tm-mark">
            &ldquo;
          </span>
          <div role="img" aria-label={`${current.rating} out of 5 stars`} className="relative flex gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={`tm-star h-5 w-5 ${i < current.rating ? "fill-amber-400 text-amber-500" : "text-navy/20"}`}
                aria-hidden="true"
              />
            ))}
          </div>
          <blockquote className="relative mt-4 text-xl font-semibold leading-relaxed text-navy sm:text-2xl">
            &ldquo;{current.quote}&rdquo;
          </blockquote>
          <figcaption className="relative mt-6 flex items-center gap-4">
            <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-cyan to-navy-light text-lg font-bold text-white">
              <span className="tm-ring" aria-hidden="true" />
              {current.name[0]}
            </span>
            <span className="leading-tight">
              <span className="block font-bold text-navy">{current.name}</span>
              <span className="block text-sm text-navy/70">{current.role}</span>
            </span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
