"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Monitor, Sparkles, Star, Stethoscope, Users } from "lucide-react";
import "./doctors-hero.css";

export interface HeroDoctor {
  id: string;
  name: string;
  specialtyName: string;
  rating: number;
  reviewCount: number;
  experienceYears: number;
  photoUrl?: string;
  supportsOnline: boolean;
  supportsInPerson: boolean;
  isTemporarilyUnavailable: boolean;
}

function CountUp({ to, decimals = 0 }: { to: number; decimals?: number }) {
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
      setValue((1 - Math.pow(1 - p, 3)) * to);
      if (p >= 1) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [to]);

  return <span className="tabular-nums">{value.toFixed(decimals)}</span>;
}

const WORDS = ["dentist", "dermatologist", "physician", "dentist"];
const ECG = "M0 40 H220 L240 40 L262 10 L286 68 L312 22 L334 40 H620 L640 40 L662 10 L686 68 L712 22 L734 40 H1000";

/** Full-width photo banner: clinic photo behind a teal overlay, animated heartbeat line, live stats. */
export function DoctorsHero({ doctors, specialtyCount }: { doctors: HeroDoctor[]; specialtyCount: number }) {
  const avg = doctors.length ? doctors.reduce((s, d) => s + d.rating, 0) / doctors.length : 0;
  const online = doctors.filter((d) => d.supportsOnline).length;
  const availableNow = doctors.filter((d) => !d.isTemporarilyUnavailable).length;


  const stats = [
    ...(doctors.length ? [{ node: <CountUp to={doctors.length} />, label: "Verified doctors", icon: Users }] : []),
    ...(specialtyCount ? [{ node: <CountUp to={specialtyCount} />, label: "Specialties", icon: Stethoscope }] : []),
    ...(doctors.length ? [{ node: <CountUp to={avg} decimals={1} />, label: "Average rating", icon: Star }] : []),
    ...(online ? [{ node: <CountUp to={online} />, label: "Offer online visits", icon: Monitor }] : []),
  ];

  return (
    <header className="dh mb-8">
      <div className="dh-photo" aria-hidden="true">
        <Image
          src="/images/doctors-hero.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 70vw, 100vw"
          className="dh-img"
        />
      </div>
      <span className="dh-overlay" aria-hidden="true" />
      <span className="dh-grid" aria-hidden="true" />
      <span className="dh-glow dh-glow-a" aria-hidden="true" />
      <span className="dh-glow dh-glow-b" aria-hidden="true" />
      <span className="dh-spot" aria-hidden="true" />

      <span className="dh-plus dh-plus-1" aria-hidden="true">+</span>
      <span className="dh-plus dh-plus-2" aria-hidden="true">+</span>
      <span className="dh-plus dh-plus-3" aria-hidden="true">+</span>

      <svg className="dh-ecg" viewBox="0 0 1000 80" preserveAspectRatio="none" fill="none" aria-hidden="true">
        <path d={ECG} stroke="rgba(255,255,255,0.18)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <path d={ECG} pathLength="1" className="dh-ecg-beat" stroke="#7ff0f7" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>

      <div className="dh-content">
        <span className="dh-badge dh-rise" style={{ animationDelay: "0.05s" }}>
          <span className="dh-live" />
          {availableNow > 0 ? `${availableNow} doctors available today` : "Credential-checked specialists"}
        </span>

        <h1 className="mt-5 text-4xl font-black leading-[1.05] text-white sm:text-5xl lg:text-6xl">
          <span className="dh-word" style={{ animationDelay: "0.2s" }}>Find</span>{" "}
          <span className="dh-word" style={{ animationDelay: "0.3s" }}>a</span>{" "}
          <span className="relative inline-block">
            <span className="dh-word dh-title" style={{ animationDelay: "0.42s" }}>Doctor</span>
            <span className="dh-underline" aria-hidden="true" />
          </span>
          <br className="hidden sm:block" />{" "}
          <span className="dh-word" style={{ animationDelay: "0.6s" }}>you</span>{" "}
          <span className="dh-word" style={{ animationDelay: "0.7s" }}>can</span>{" "}
          <span className="dh-word" style={{ animationDelay: "0.8s" }}>trust</span>
        </h1>

        <p className="dh-rise mt-4 text-xl font-bold text-white sm:text-2xl" style={{ animationDelay: "0.25s" }}>
          Book a verified{" "}
          <span className="dh-rot dh-words" aria-hidden="true">
            <span>
              {WORDS.map((w, i) => (
                <span key={i}>{w}</span>
              ))}
            </span>
          </span>
          <span className="sr-only">dentist, dermatologist or physician</span>
        </p>

        <p className="dh-rise mt-3 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg" style={{ animationDelay: "0.35s" }}>
          Browse verified specialists across dental, dermatology and general health, then book the time that suits you.
        </p>

        <div className="dh-rise mt-7 flex flex-wrap gap-3" style={{ animationDelay: "0.45s" }}>
          <a href="#doctor-results" className="dh-btn dh-btn-solid">
            Browse doctors <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
          <Link href="/ai-assistant" className="dh-btn dh-btn-ghost">
            <Sparkles className="h-4 w-4" aria-hidden="true" /> Help me choose
          </Link>
        </div>

        {stats.length > 0 && (
          <dl className="mt-9 grid grid-cols-2 gap-x-8 gap-y-5 sm:flex sm:flex-wrap sm:gap-x-10">
            {stats.map((s, i) => (
              <div key={s.label} className="dh-stat" style={{ animationDelay: `${0.6 + i * 0.12}s` }}>
                <dd className="flex items-center gap-2 text-3xl font-black text-white">
                  <s.icon className="h-5 w-5 text-cyan-200" aria-hidden="true" />
                  {s.node}
                </dd>
                <dt className="mt-0.5 text-sm font-medium text-white/70">{s.label}</dt>
              </div>
            ))}
          </dl>
        )}
      </div>
    </header>
  );
}
