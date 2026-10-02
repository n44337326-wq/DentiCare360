"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CalendarCheck,
  CalendarClock,
  HelpCircle,
  LockKeyhole,
  Sparkles,
  Stethoscope,
  UserRound,
  Video,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { FaqItem } from "@/content/site-content";
import "./faq.css";

const FALLBACK_ICONS: LucideIcon[] = [HelpCircle, Stethoscope, Sparkles, Bot];

const KEYWORD_ICONS: [RegExp, LucideIcon][] = [
  [/private|privacy|secure|record|data/i, LockKeyhole],
  [/cost|price|fee|pay|insurance/i, Wallet],
  [/online|video|remote/i, Video],
  [/cancel|change|reschedul|unavailable|away/i, CalendarClock],
  [/book|appointment|schedule/i, CalendarCheck],
  [/\bAI\b|assistant/i, Bot],
];

function iconFor(question: string, index: number) {
  return KEYWORD_ICONS.find(([re]) => re.test(question))?.[1] ?? FALLBACK_ICONS[index % FALLBACK_ICONS.length];
}

const TYPING_MS = 900;

/** Interactive FAQ: pick a question and the answer is "typed" back in a chat window. */
export function Faq({
  items,
  title = "Frequently asked questions",
  description,
  id = "faq",
}: {
  items: FaqItem[];
  title?: string;
  description?: string;
  id?: string;
}) {
  const [active, setActive] = useState(0);
  const [shown, setShown] = useState(0);
  const [typing, setTyping] = useState(true);

  const current = items[active];

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setTyping(false);
      setShown(current.a.length);
      return;
    }
    setTyping(true);
    setShown(0);
    let interval: ReturnType<typeof setInterval> | undefined;
    const wait = setTimeout(() => {
      setTyping(false);
      interval = setInterval(() => {
        setShown((s) => {
          if (s >= current.a.length) {
            clearInterval(interval);
            return s;
          }
          return s + 2;
        });
      }, 14);
    }, TYPING_MS);
    return () => {
      clearTimeout(wait);
      clearInterval(interval);
    };
  }, [active, current.a]);

  const finished = !typing && shown >= current.a.length;

  return (
    <section aria-labelledby={`${id}-heading`} className="faq-wrap isolate mx-auto max-w-6xl">
      <span aria-hidden="true" className="faq-blob faq-blob-a" />
      <span aria-hidden="true" className="faq-blob faq-blob-b" />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-center lg:gap-14">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-cyan/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-cyan">
            <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" /> FAQ
          </span>
          <h2 id={`${id}-heading`} className="mt-4 text-3xl font-black leading-tight text-navy sm:text-4xl">
            {title}
          </h2>
          {description && <p className="mt-3 text-navy/70">{description}</p>}

          <div role="tablist" aria-label={title} aria-orientation="vertical" className="mt-7 space-y-2.5">
            {items.map((item, i) => {
              const Icon = iconFor(item.q, i);
              return (
                <button
                  key={item.q}
                  type="button"
                  role="tab"
                  aria-selected={i === active}
                  onClick={() => setActive(i)}
                  className="faq-q focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <span className="faq-q-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="flex-1 text-sm font-semibold sm:text-base">{item.q}</span>
                  <ArrowRight className="faq-q-arrow h-4 w-4 shrink-0" aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="faq-chat">
          <div className="flex items-center gap-3 bg-gradient-to-r from-navy to-navy-light px-5 py-4 text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan to-blue">
              <Bot className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold">DentiCare Support</p>
              <p className="flex items-center gap-1.5 text-xs text-white/70">
                <span className="faq-status h-2 w-2 rounded-full bg-green" /> Online
              </p>
            </div>
          </div>

          <div className="faq-chat-body flex min-h-[22rem] flex-col gap-4 p-5 sm:p-6" aria-live="polite">
            <div key={`q-${active}`} className="faq-bubble-user ml-auto flex max-w-[88%] items-end gap-2">
              <p className="rounded-2xl rounded-br-sm bg-gradient-to-r from-cyan to-blue px-4 py-2.5 text-sm font-semibold text-white shadow-md">
                {current.q}
              </p>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy/10 text-navy">
                <UserRound className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>

            <div key={`a-${active}`} className="faq-bubble-bot flex max-w-[92%] items-end gap-2" style={{ animationDelay: "250ms" }}>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan to-blue text-white">
                <Bot className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="rounded-2xl rounded-bl-sm bg-white px-4 py-3 text-sm leading-relaxed text-navy shadow-md ring-1 ring-navy/5 sm:text-base">
                {typing ? (
                  <span className="flex h-5 items-center gap-1.5" aria-label="Typing">
                    <span className="faq-dot" />
                    <span className="faq-dot" />
                    <span className="faq-dot" />
                  </span>
                ) : (
                  <>
                    {current.a.slice(0, shown)}
                    {!finished && <span className="faq-caret" aria-hidden="true" />}
                  </>
                )}
              </div>
            </div>

            {finished && (
              <div className="faq-bubble-bot ml-9 flex flex-wrap gap-2" style={{ animationDelay: "100ms" }}>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1.5 rounded-full bg-navy px-3.5 py-1.5 text-xs font-bold text-white transition-transform hover:-translate-y-0.5"
                >
                  Contact us <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
                <Link
                  href="/ai-assistant"
                  className="inline-flex items-center gap-1.5 rounded-full bg-cyan/15 px-3.5 py-1.5 text-xs font-bold text-navy transition-transform hover:-translate-y-0.5"
                >
                  <Sparkles className="h-3.5 w-3.5 text-cyan" aria-hidden="true" /> Ask the AI Assistant
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
