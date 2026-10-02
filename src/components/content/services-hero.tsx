"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Stethoscope } from "lucide-react";
import "./services.css";

function CountUp({ to }: { to: number }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(to);
      return;
    }
    const start = performance.now();
    const duration = 1400;
    const timer = setInterval(() => {
      const p = Math.min((performance.now() - start) / duration, 1);
      setValue(Math.round((1 - Math.pow(1 - p, 3)) * to));
      if (p >= 1) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [to]);

  return <span className="svc-stat-num">{value}</span>;
}

const ORBIT = [
  { label: "Dental", emoji: "🦷", style: { top: "0%", left: "50%" } },
  { label: "Skin & Derma", emoji: "✨", style: { top: "75%", left: "93.3%" } },
  { label: "General Health", emoji: "🩺", style: { top: "75%", left: "6.7%" } },
];

export function ServicesHero({ services, areas }: { services?: number; areas?: number }) {
  const stats = [
    ...(services ? [{ value: services, suffix: "+", label: "Services" }] : []),
    ...(areas ? [{ value: areas, suffix: "", label: "Care areas" }] : []),
    { value: 100, suffix: "%", label: "Online booking" },
  ];

  return (
    <header className="svc-hero mb-8 grid items-center gap-10 px-6 py-12 sm:px-12 lg:grid-cols-[1.15fr_1fr] lg:py-14">
      <span aria-hidden="true" className="svc-hero-bg" />
      <span aria-hidden="true" className="svc-hero-grid" />

      <div>
        <span className="animate-fade-in-up inline-flex items-center gap-2 rounded-full bg-cyan/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-cyan">
          <Stethoscope className="h-3.5 w-3.5" aria-hidden="true" /> Book online
        </span>
        <h1 className="animate-fade-in-up mt-4 text-4xl font-black leading-[1.1] text-navy sm:text-5xl lg:text-6xl" style={{ animationDelay: "80ms" }}>
          Our <span className="svc-title-grad">Services</span>
        </h1>
        <span aria-hidden="true" className="svc-underline" />
        <p className="animate-fade-in-up mt-5 max-w-xl text-lg leading-relaxed text-navy/75" style={{ animationDelay: "160ms" }}>
          Every service can be booked online with a suitable specialist. Prices are demo starting prices for
          illustration; the final fee depends on your consultation.
        </p>

        <div className="animate-fade-in-up mt-7 flex flex-wrap gap-3" style={{ animationDelay: "240ms" }}>
          <Link
            href="/appointments/book"
            className="svc-cta inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan to-blue px-5 py-3 text-sm font-bold text-white shadow-lg shadow-cyan/30 hover:shadow-xl hover:shadow-cyan/40"
          >
            Book appointment <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href="/ai-assistant"
            className="svc-cta inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-navy shadow-sm ring-1 ring-navy/10 hover:shadow-md"
          >
            <Sparkles className="h-4 w-4 text-cyan" aria-hidden="true" /> Ask the AI Assistant
          </Link>
        </div>

        <dl className="mt-9 flex flex-wrap gap-x-8 gap-y-4 border-t border-navy/10 pt-6">
          {stats.map((s, i) => (
            <div key={s.label} className="svc-stat" style={{ animationDelay: `${400 + i * 120}ms` }}>
              <dd className="text-3xl font-black text-navy">
                <CountUp to={s.value} />
                <span className="text-cyan">{s.suffix}</span>
              </dd>
              <dt className="text-sm font-medium text-navy/65">{s.label}</dt>
            </div>
          ))}
        </dl>
      </div>

      <div aria-hidden="true" className="svc-orbit-wrap">
        <span className="svc-ring svc-ring-1" />
        <span className="svc-ring svc-ring-2" />
        <span className="svc-ring svc-ring-3" />
        <span className="svc-spark" style={{ top: "14%", left: "24%" }} />
        <span className="svc-spark" style={{ top: "70%", left: "50%", animationDelay: "-1s" }} />
        <span className="svc-spark" style={{ top: "30%", left: "88%", animationDelay: "-2s" }} />

        <div className="svc-core">
          <Stethoscope className="h-9 w-9" strokeWidth={1.75} />
          <span className="mt-1 text-xs font-bold tracking-wide">360° care</span>
        </div>

        <div className="svc-orbit">
          {ORBIT.map((o) => (
            <span key={o.label} className="svc-orbit-slot" style={o.style}>
              <span className="svc-orbit-item">
                <span className="svc-orbit-emoji">{o.emoji}</span>
                {o.label}
              </span>
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}
