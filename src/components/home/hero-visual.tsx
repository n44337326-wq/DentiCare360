"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Baby, BadgeCheck, CalendarCheck, Check, HeartPulse, ScanFace, ShieldCheck, Smile, Sparkles, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";
import "./hero.css";

const AVAILABILITY = [
  ["Dentistry", "Today"],
  ["Dermatology", "Tomorrow"],
  ["General health", "Today"],
];

const SLOTS = ["9:00 AM", "9:30 AM", "10:00 AM"];

/**
 * One node per area of care on the radar. `phi` is the bearing in degrees clockwise from
 * the top; the sweep flashes each node as it passes that bearing. `r` is the distance
 * from the centre as a % of the radar's width.
 */
const NODES = [
  { icon: Smile, r: 40, phi: 305 },
  { icon: Sparkles, r: 27, phi: 345 },
  { icon: ScanFace, r: 44, phi: 265 },
  { icon: Stethoscope, r: 30, phi: 235 },
  { icon: Baby, r: 40, phi: 180 },
  { icon: ShieldCheck, r: 46, phi: 95 },
].map((n) => {
  const rad = (n.phi * Math.PI) / 180;
  return { ...n, x: 50 + n.r * Math.sin(rad), y: 50 - n.r * Math.cos(rad) };
});

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Chat states: 0 empty · 1 patient message · 2 assistant typing · 3 assistant reply. Starts fully shown (no-JS / SSR). */
const CHAT_FULL = 3;

/**
 * Decorative product preview for the hero. Purely illustrative (fictional demo data), so it is
 * hidden from assistive tech. A "care radar" sweeps around a pulsing core and lights up each
 * area of care; three product cards sit around it. From `lg` up the whole composition leans
 * toward the pointer in 3D (pointer variables come from the hero backdrop); below that it stacks.
 * All motion stops for users who prefer reduced motion.
 */
export function HeroVisual() {
  const [slot, setSlot] = useState(0);
  const [chat, setChat] = useState(CHAT_FULL);

  // Cycle the highlighted appointment time.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = window.setInterval(() => setSlot((s) => (s + 1) % SLOTS.length), 2600);
    return () => window.clearInterval(id);
  }, []);

  // Play the AI conversation on a loop: message → typing → reply → pause → repeat.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const timers: number[] = [];
    const play = () => {
      const at = (ms: number, state: number) => timers.push(window.setTimeout(() => setChat(state), ms));
      at(0, 0);
      at(700, 1);
      at(1800, 2);
      at(3400, 3);
      timers.push(window.setTimeout(play, 10500));
    };
    timers.push(window.setTimeout(play, 2400)); // let the entrance animations finish first
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  return (
    <div
      aria-hidden="true"
      className="hero-visual hero-stage relative mx-auto w-full max-w-md lg:mx-0 lg:aspect-square lg:max-w-[34rem] lg:justify-self-end"
    >
      <div className="hero-tilt lg:absolute lg:inset-0">
        {/* Care radar */}
        <div className="relative mx-auto mb-6 aspect-square w-[min(100%,18rem)] lg:absolute lg:inset-0 lg:mb-0 lg:w-full">
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" fill="none">
            {[48, 38, 28, 18].map((r) => (
              <circle key={r} cx="50" cy="50" r={r} stroke="rgb(255 255 255 / 0.14)" strokeWidth="0.3" />
            ))}
            <path d="M50 2V98M2 50H98" stroke="rgb(255 255 255 / 0.08)" strokeWidth="0.3" />
            <g className="hero-ring-slow" style={{ transformOrigin: "50% 50%", transformBox: "view-box" }}>
              <circle cx="50" cy="50" r="49.3" stroke="rgb(255 255 255 / 0.38)" strokeWidth="1.2" strokeDasharray="0.2 2.8" />
            </g>
            <g className="hero-ring-rev" style={{ transformOrigin: "50% 50%", transformBox: "view-box" }}>
              <circle cx="50" cy="50" r="43" stroke="rgb(94 224 238 / 0.55)" strokeWidth="0.35" strokeDasharray="1.2 2.6" strokeLinecap="round" />
            </g>
          </svg>

          <div className="hero-radar-sweep absolute inset-[2%]" />

          {/* Pulsing core */}
          <div className="absolute left-1/2 top-1/2 flex h-[17%] w-[17%] -translate-x-1/2 -translate-y-1/2 items-center justify-center">
            <span className="hero-core-ring absolute inset-0 rounded-full border border-cyan/70" />
            <span className="hero-core-ring absolute inset-0 rounded-full border border-cyan/70" style={{ animationDelay: "1.5s" }} />
            <span className="relative flex h-full w-full items-center justify-center rounded-full border border-white/30 bg-navy-light/80 text-white shadow-[0_0_40px_rgb(19_163_179/0.65)]">
              <HeartPulse className="h-1/2 w-1/2" />
            </span>
          </div>

          {NODES.map(({ icon: Icon, x, y, phi }) => (
            <span key={phi} className="absolute" style={{ left: `${x}%`, top: `${y}%` }}>
              <span
                className="hero-blip -ml-5 -mt-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white"
                style={{ "--phi": phi } as CSSProperties}
              >
                <Icon className="h-[18px] w-[18px]" />
              </span>
            </span>
          ))}
        </div>

        <div className="grid gap-4 lg:contents">
          {/* Next available appointment */}
          <div className="hero-z1 lg:absolute lg:right-0 lg:top-0 lg:w-[56%]">
            <div className="hero-float">
              <div
                className="hero-card-in relative overflow-hidden rounded-2xl border border-white/40 bg-white p-4 shadow-[0_30px_60px_-25px_rgb(0_0_0/0.65)]"
                style={{ animationDelay: "300ms" }}
              >
                <span
                  aria-hidden="true"
                  className="hero-sweep pointer-events-none absolute inset-y-0 left-0 w-1/4 -skew-x-12 bg-linear-to-r from-transparent via-cyan-light/80 to-transparent"
                />
                <p className="relative flex items-center gap-1.5 whitespace-nowrap text-[11px] font-semibold uppercase tracking-wide text-cyan xl:text-xs">
                  <CalendarCheck className="h-3.5 w-3.5" /> Next available appointment
                </p>
                <div className="relative mt-3 flex items-center gap-3">
                  <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-semibold text-white">
                    AC
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                      <span className="hero-ping absolute inline-flex h-full w-full rounded-full bg-green" />
                      <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-green" />
                    </span>
                  </span>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1 text-sm font-semibold text-navy">
                      Dr. Amara Chen <BadgeCheck className="h-4 w-4 text-cyan" />
                    </p>
                    <p className="text-xs text-navy/70">Dentist &middot; Downtown Clinic</p>
                  </div>
                </div>
                <div className="relative mt-4 grid grid-cols-3 gap-2 text-center text-[13px]">
                  <span
                    className="absolute inset-y-0 left-0 rounded-lg border border-cyan bg-cyan-light transition-transform duration-500 ease-out motion-reduce:transition-none"
                    style={{ width: "calc((100% - 1rem) / 3)", transform: `translateX(calc(${slot} * (100% + 0.5rem)))` }}
                  />
                  {SLOTS.map((t, i) => (
                    <span
                      key={t}
                      className={cn(
                        "relative rounded-lg border py-2 transition-colors duration-300",
                        i === slot ? "border-transparent font-medium text-navy" : "border-border text-navy/80"
                      )}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div
                  key={slot}
                  className="hero-pop relative mt-4 flex h-10 items-center justify-center gap-2 rounded-lg bg-navy text-sm font-medium text-white shadow-sm"
                >
                  <Check className="h-4 w-4" /> Confirm appointment
                </div>
              </div>
            </div>
          </div>

          {/* Doctor availability */}
          <div className="hero-z2 lg:absolute lg:bottom-[7%] lg:left-0 lg:w-[45%]">
            <div className="hero-float" style={{ animationDelay: "-2.5s" }}>
              <div
                className="hero-card-in rounded-2xl border border-white/40 bg-white p-4 shadow-[0_30px_60px_-25px_rgb(0_0_0/0.65)]"
                style={{ animationDelay: "500ms" }}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-navy/70">Doctor availability</p>
                <ul className="mt-3 space-y-2.5 text-sm">
                  {AVAILABILITY.map(([label, when], i) => (
                    <li
                      key={label}
                      className="hero-rise flex items-center justify-between gap-2"
                      style={{ animationDelay: `${950 + i * 140}ms` }}
                    >
                      <span className="flex items-center gap-2 whitespace-nowrap text-navy">
                        <span className="relative flex h-2 w-2">
                          <span className="hero-ping absolute inline-flex h-full w-full rounded-full bg-green" style={{ animationDelay: `${i * 0.5}s` }} />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-green" />
                        </span>
                        {label}
                      </span>
                      <span className="rounded-full bg-soft-blue px-2 py-0.5 text-xs text-navy/80">{when}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* AI assistant preview */}
          <div className="hero-z3 lg:absolute lg:bottom-0 lg:right-0 lg:w-[50%]">
            <div className="hero-float" style={{ animationDelay: "-4.5s" }}>
              <div
                className="hero-card-in rounded-2xl border border-white/40 bg-white p-4 shadow-[0_30px_60px_-25px_rgb(0_0_0/0.65)]"
                style={{ animationDelay: "700ms" }}
              >
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-navy/70">
                  <Sparkles className="h-3.5 w-3.5 text-cyan" /> AI Health Assistant
                </p>
                <div className="mt-3 flex min-h-[7.25rem] flex-col gap-2">
                  <p
                    className={cn(
                      "w-fit max-w-full rounded-2xl rounded-bl-sm bg-soft-blue px-3 py-2 text-sm text-navy transition-all duration-500 motion-reduce:transition-none",
                      chat >= 1 ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
                    )}
                  >
                    I have a sore tooth
                  </p>
                  <div className="ml-auto grid max-w-[92%]">
                    <span
                      className={cn(
                        "flex h-9 w-14 items-center justify-center gap-1 rounded-2xl rounded-br-sm bg-navy transition-opacity duration-300 [grid-area:1/1] justify-self-end",
                        chat === 2 ? "opacity-100" : "opacity-0"
                      )}
                    >
                      {[0, 1, 2].map((d) => (
                        <span key={d} className="hero-dot h-1.5 w-1.5 rounded-full bg-white" style={{ animationDelay: `${d * 0.15}s` }} />
                      ))}
                    </span>
                    <p
                      className={cn(
                        "w-fit rounded-2xl rounded-br-sm bg-navy px-3 py-2 text-sm text-white transition-all duration-500 [grid-area:1/1] justify-self-end motion-reduce:transition-none",
                        chat >= 3 ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
                      )}
                    >
                      A dental consultation may help. Shall we look at times?
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-white/55 lg:absolute lg:-bottom-9 lg:right-0 lg:mt-0 lg:text-right">
        Illustrative preview &middot; demo data
      </p>
    </div>
  );
}
