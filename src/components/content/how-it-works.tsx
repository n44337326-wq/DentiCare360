"use client";

import { useEffect, useRef, useState } from "react";
import { HOW_IT_WORKS } from "@/content/site-content";
import { MessageCircle, Users, CheckCircle, Calendar } from "lucide-react";
import "./how-it-works.css";

const ICONS = [MessageCircle, Users, CheckCircle, Calendar];

/** Four-step explainer of the patient journey, revealed step by step as it scrolls into view. */
export function HowItWorks({ tinted = false }: { tinted?: boolean }) {
  const listRef = useRef<HTMLOListElement>(null);
  const [visible, setVisible] = useState<boolean[]>(() => HOW_IT_WORKS.map(() => false));

  useEffect(() => {
    const items = Array.from(listRef.current?.children ?? []);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = items.indexOf(entry.target);
          setVisible((prev) => prev.map((v, i) => (i === index ? true : v)));
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.25 },
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return (
    <section aria-labelledby="how-heading" className={tinted ? "bg-soft-blue py-20" : "py-20"}>
      <div className="container-app">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 id="how-heading" className="text-4xl font-black text-navy">
            How DentiCare360 works
          </h2>
          <p className="mt-4 text-lg text-navy/70">From need help to your appointment in four simple steps.</p>
        </div>

        <div className="mx-auto max-w-5xl">
          <ol ref={listRef} className="space-y-8">
            {HOW_IT_WORKS.map((step, i) => {
              const Icon = ICONS[i];
              return (
                <li
                  key={step.title}
                  className="hiw-step flex items-start gap-8"
                  data-visible={visible[i]}
                  style={{ "--hiw-delay": "80ms" } as React.CSSProperties}
                >
                  <div className="relative flex-shrink-0 pt-2">
                    <div className="hiw-num relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan to-blue text-2xl font-black text-white shadow-lg">
                      <span className="hiw-ring text-cyan" aria-hidden="true" />
                      {i + 1}
                    </div>
                    {i < HOW_IT_WORKS.length - 1 && <div className="hiw-line" aria-hidden="true" />}
                  </div>

                  <div className="flex-1 pt-1">
                    <div className="mb-2 flex items-start gap-4">
                      <div className="hiw-icon flex-shrink-0 rounded-lg bg-gradient-to-br from-cyan/15 to-blue/15 p-3">
                        <Icon className="h-6 w-6 text-cyan" strokeWidth={2} />
                      </div>
                      <h3 className="hiw-title text-xl font-black leading-tight text-navy">{step.title}</h3>
                    </div>
                    <p className="hiw-desc text-sm leading-relaxed text-navy/70">{step.desc}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
