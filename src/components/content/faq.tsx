"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  CalendarCheck,
  CalendarClock,
  CheckCheck,
  HelpCircle,
  LockKeyhole,
  SendHorizontal,
  ShieldCheck,
  Smile,
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
          <div className="faq-chat-head">
            <span className="faq-chat-avatar">
              <span className="faq-chat-avatar-ring" />
              <Bot className="relative h-5 w-5" aria-hidden="true" />
            </span>
            <div className="leading-tight">
              <p className="flex items-center gap-1.5 text-sm font-bold">
                DentiCare Support <BadgeCheck className="h-4 w-4 text-cyan-200" aria-hidden="true" />
              </p>
              <p className="flex items-center gap-1.5 text-xs text-white/75">
                <span className="faq-status h-2 w-2 rounded-full bg-green" /> {typing ? "typing…" : "Online · replies instantly"}
              </p>
            </div>
            <span className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/90">
              <ShieldCheck className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
          </div>

          <div className="faq-chat-body flex min-h-[19rem] flex-col gap-3.5 p-5 sm:p-6" aria-live="polite">
            <span className="faq-day">Today</span>

            <div key={`q-${active}`} className="faq-bubble-user ml-auto max-w-[88%]">
              <div className="flex items-end justify-end gap-2">
                <p className="faq-user-msg">{current.q}</p>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy/10 text-navy">
                  <UserRound className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
              <p className="faq-meta mr-9 justify-end">
                Just now <CheckCheck className="h-3.5 w-3.5 text-cyan" aria-hidden="true" />
              </p>
            </div>

            <div key={`a-${active}`} className="faq-bubble-bot max-w-[92%]" style={{ animationDelay: "250ms" }}>
              <div className="flex items-end gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan to-blue text-white">
                  <Bot className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="faq-bot-msg">
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
              {finished && <p className="faq-meta ml-9">Support · Just now</p>}
            </div>

            {finished && (
              <div className="faq-bubble-bot ml-9" style={{ animationDelay: "100ms" }}>
                <p className="faq-hint">Related questions</p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {items
                    .map((item, i) => ({ item, i }))
                    .filter(({ i }) => i !== active)
                    .slice(0, 2)
                    .map(({ item, i }) => (
                      <button key={item.q} type="button" onClick={() => setActive(i)} className="faq-quick">
                        {item.q}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          <div className="faq-chat-foot">
            <div className="flex flex-wrap gap-2 px-5 pb-3 pt-4">
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
            <div className="faq-input" aria-hidden="true">
              <Smile className="h-5 w-5 text-navy/40" />
              <span className="flex-1 text-sm text-navy/45">
                Type your question<span className="faq-caret" />
              </span>
              <span className="faq-send">
                <SendHorizontal className="h-4 w-4" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
