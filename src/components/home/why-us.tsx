"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, BadgeCheck, CalendarClock, HeartHandshake, Layers, LockKeyhole, Radar, Stethoscope } from "lucide-react";
import "./why-us.css";

const ITEMS = [
  {
    icon: Layers,
    title: "One platform",
    desc: "Dental, skin and general health without juggling separate websites.",
    detail: "One account, one set of records and one place for appointments, documents and payments.",
  },
  {
    icon: BadgeCheck,
    title: "Verified doctors",
    desc: "Every specialist is credential-checked before joining DentiCare360.",
    detail: "Each profile lists qualifications, experience, languages and patient ratings so you can choose with confidence.",
  },
  {
    icon: CalendarClock,
    title: "Easy appointments",
    desc: "Book in minutes with a guided, step-by-step flow.",
    detail: "Reschedule or cancel yourself at any time, and get confirmations and reminders automatically.",
  },
  {
    icon: Radar,
    title: "Smart availability",
    desc: "Real-time scheduling means you only see times that are actually open.",
    detail: "If a doctor is away, we tell you plainly and suggest the next open appointments right away.",
  },
  {
    icon: LockKeyhole,
    title: "Secure patient records",
    desc: "Your health data is access-controlled by role and every access is logged.",
    detail: "Documents are stored privately, and only you and the clinicians treating you can open them.",
  },
  {
    icon: HeartHandshake,
    title: "Human-led healthcare",
    desc: "AI helps you get organised. Licensed clinicians make every medical decision.",
    detail: "Our assistant never diagnoses or prescribes, and sends emergencies straight to urgent care.",
  },
];

export function WhyUs() {
  const listRef = useRef<HTMLOListElement>(null);
  const [visible, setVisible] = useState<boolean[]>(() => ITEMS.map(() => false));

  useEffect(() => {
    const rows = Array.from(listRef.current?.children ?? []);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = rows.indexOf(entry.target);
          setVisible((prev) => prev.map((v, i) => (i === index ? true : v)));
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.2 },
    );
    rows.forEach((row) => observer.observe(row));
    return () => observer.disconnect();
  }, []);

  return (
    <section aria-labelledby="why-heading" className="container-app py-20">
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <span className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-cyan">
          <span aria-hidden="true" className="h-0.5 w-8 bg-cyan" /> Our promise
          <span aria-hidden="true" className="h-0.5 w-8 bg-cyan" />
        </span>
        <h2 id="why-heading" className="mt-4 text-4xl font-black leading-tight text-navy sm:text-5xl">
          Why <span className="bg-gradient-to-r from-cyan to-navy-light bg-clip-text text-transparent">DentiCare360</span>
        </h2>
        <p className="mt-4 text-lg text-navy/70">Care that is simple to reach and safe to trust.</p>
      </div>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)] lg:gap-20">
        <div aria-hidden="true" className="hidden lg:sticky lg:top-28 lg:block lg:self-start">
          <div className="why-visual">
            <div className="why-glow" />
            <div className="why-panel">
              <div className="why-scan" />
              <div className="flex items-center gap-3 bg-gradient-to-r from-navy to-navy-light p-4 text-white">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15">
                  <Stethoscope className="h-5 w-5" />
                </span>
                <div className="flex-1 leading-tight">
                  <p className="text-sm font-bold">Your specialist</p>
                  <p className="text-xs text-white/70">Credential-checked</p>
                </div>
                <svg viewBox="0 0 24 24" className="h-7 w-7 text-cyan" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
                  <path className="why-tick" d="M7 12.5l3.2 3.2L17 9" />
                </svg>
              </div>
              <div className="p-4">
                <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-navy/60">
                  <CalendarClock className="h-4 w-4 text-cyan" /> Open appointments
                </p>
                <div className="grid grid-cols-3 gap-2 text-center text-sm font-semibold">
                  {["09:00", "10:30", "12:00"].map((t) => (
                    <span key={t} className="why-slot rounded-lg bg-cyan/10 py-2 text-navy">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="mt-4 space-y-2.5">
                  <div className="h-2.5 w-4/5 rounded-full bg-navy/10" />
                  <div className="h-2.5 w-3/5 rounded-full bg-navy/10" />
                  <div className="h-2.5 w-2/3 rounded-full bg-navy/10" />
                </div>
                <div className="mt-5 rounded-xl bg-gradient-to-r from-cyan to-blue py-2.5 text-center text-sm font-bold text-white">
                  Confirm appointment
                </div>
              </div>
            </div>

            <div className="why-chip why-chip-a">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan/15">
                <LockKeyhole className="h-4 w-4 text-cyan" />
              </span>
              <span className="text-xs font-bold text-navy">Private records</span>
            </div>
            <div className="why-chip why-chip-b">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green/15">
                <Radar className="h-4 w-4 text-green" />
              </span>
              <span className="text-xs font-bold text-navy">Live availability</span>
            </div>
            <div className="why-chip why-chip-c">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan/15">
                <HeartHandshake className="h-4 w-4 text-cyan" />
              </span>
              <span className="text-xs font-bold text-navy">Human-led care</span>
            </div>
          </div>
        </div>

        <ol ref={listRef} className="divide-y divide-navy/10 border-y border-navy/10">
          {ITEMS.map(({ icon: Icon, title, desc, detail }, i) => (
            <li
              key={title}
              className="why-row py-7"
              data-visible={visible[i]}
              style={{ transitionDelay: "60ms" }}
            >
              <div className="why-body flex items-start gap-5 sm:gap-7">
                <span aria-hidden="true" className="why-num w-14 flex-shrink-0 text-5xl font-black leading-none sm:w-20 sm:text-6xl">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="why-icon flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-cyan-light text-navy">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="flex items-center gap-2 text-xl font-bold text-navy">
                    {title}
                    <ArrowUpRight className="why-arrow h-5 w-5 text-cyan" aria-hidden="true" />
                  </h3>
                  <p className="mt-1.5 text-navy/80">{desc}</p>
                  <p className="mt-2 text-sm leading-relaxed text-navy/60">{detail}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
