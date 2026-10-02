"use client";

import { useRef, type CSSProperties, type PointerEvent } from "react";
import { BadgeCheck, BellRing, CalendarCheck, CheckCircle2, HeartPulse, Smile, Sparkles, Stethoscope, Zap } from "lucide-react";
import "./booking-mockup.css";

const CHIPS = [
  { label: "Dental", icon: Smile, on: true },
  { label: "Skin", icon: Sparkles, on: false },
  { label: "General", icon: HeartPulse, on: false },
];
const DAYS = [
  { d: "Mon", n: 10 },
  { d: "Tue", n: 11 },
  { d: "Wed", n: 12 },
  { d: "Thu", n: 13 },
  { d: "Fri", n: 14 },
];
const SLOTS = ["09:00", "10:30", "12:00", "14:30"];
const STEPS = ["Care", "Day", "Time", "Confirm"];

/** Stack of floating 3D cards running an animated online-booking demo; tilts with the pointer. Decorative. */
export function BookingMockup() {
  const tilt = useRef<HTMLDivElement>(null);

  function onMove(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse" || !tilt.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    tilt.current.style.setProperty("--ry", `${(x * 22).toFixed(2)}deg`);
    tilt.current.style.setProperty("--rx", `${(-y * 16).toFixed(2)}deg`);
  }

  function onLeave() {
    tilt.current?.style.setProperty("--ry", "0deg");
    tilt.current?.style.setProperty("--rx", "0deg");
  }

  return (
    <div className="bk" aria-hidden="true" onPointerMove={onMove} onPointerLeave={onLeave}>
      <span className="bk-blob bk-blob-a" />
      <span className="bk-blob bk-blob-b" />
      <span className="bk-blob bk-blob-c" />

      <div ref={tilt} className="bk-tilt">
        <div className="bk-sway">
          <span className="bk-plate" />

          <div className="bk-card bk-a">
            <div className="bk-bar">
              <span className="bk-dot bg-rose-300" />
              <span className="bk-dot bg-amber-300" />
              <span className="bk-dot bg-emerald-300" />
              <span className="bk-url">
                <span className="bk-lock" /> denticare360 / book online
              </span>
            </div>

            <div className="bk-steps">
              {STEPS.map((s, i) => (
                <span key={s} className="bk-step" style={{ "--n": i } as CSSProperties}>
                  <span className="bk-step-fill" />
                  <span className="bk-step-label">{s}</span>
                </span>
              ))}
            </div>

            <div className="space-y-3.5 p-4 pt-2">
              <div>
                <p className="bk-title">Choose your care</p>
                <div className="mt-2 flex gap-2">
                  {CHIPS.map((c) => (
                    <span key={c.label} className={c.on ? "bk-chip bk-chip-pick" : "bk-chip"}>
                      <c.icon className="h-3.5 w-3.5" strokeWidth={2.2} />
                      {c.label}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="bk-title">Pick a day</p>
                <div className="mt-2 grid grid-cols-5 gap-1.5">
                  {DAYS.map((d, i) => (
                    <span key={d.d} className={i === 2 ? "bk-day bk-day-pick" : "bk-day"}>
                      <span className="text-[9px] font-semibold uppercase opacity-70">{d.d}</span>
                      <span className="text-sm font-black">{d.n}</span>
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="bk-title">Pick a time</p>
                <div className="mt-2 grid grid-cols-4 gap-1.5">
                  {SLOTS.map((s, i) => (
                    <span key={s} className={i === 1 ? "bk-slot bk-slot-pick" : "bk-slot"}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bk-card bk-b">
            <div className="flex items-center gap-2.5">
              <span className="bk-avatar">
                <span className="bk-avatar-ring" />
                <Stethoscope className="relative h-5 w-5" strokeWidth={2} />
              </span>
              <span className="leading-tight">
                <span className="flex items-center gap-1 text-[13px] font-bold text-white">
                  Matched specialist <BadgeCheck className="h-3.5 w-3.5 text-cyan-200" />
                </span>
                <span className="text-[11px] text-white/70">Credential-checked</span>
              </span>
            </div>
            <span className="bk-avail">
              <span className="bk-avail-dot" /> Available today
            </span>
          </div>

          <div className="bk-card bk-c">
            <div className="bk-btn">
              <span className="bk-btn-a">
                <CalendarCheck className="h-4 w-4" /> Confirm appointment
              </span>
              <span className="bk-btn-b">
                <CheckCircle2 className="h-4 w-4" /> Appointment confirmed
              </span>
              {Array.from({ length: 10 }, (_, i) => (
                <span key={i} className="bk-spark" style={{ "--a": `${i * 36}deg`, "--h": i % 2 ? "#fde68a" : "#ffffff" } as CSSProperties} />
              ))}
            </div>
            <div className="bk-remind">
              <span className="bk-remind-icon">
                <BellRing className="h-3.5 w-3.5" />
              </span>
              <span className="leading-tight">
                <span className="block text-[12px] font-bold text-navy">Reminder set</span>
                <span className="block text-[10px] text-navy/55">We will notify you before your visit</span>
              </span>
            </div>
          </div>

          <div className="bk-live">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-xs font-bold text-navy">Real-time availability</span>
          </div>

          <div className="bk-cursor">
            <svg viewBox="0 0 24 24" className="h-6 w-6">
              <path d="M4 3l14 8-6 1.8L9.6 19 4 3z" fill="#0b2447" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
            <span className="bk-click" />
          </div>
        </div>
      </div>
    </div>
  );
}
