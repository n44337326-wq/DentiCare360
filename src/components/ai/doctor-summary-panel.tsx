"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ChevronDown, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

/** Collapsible "Summary for your doctor". Always labelled as patient-reported, never a diagnosis. */
export function DoctorSummaryPanel({ summary, isPatient }: { summary: string; isPatient: boolean }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  if (!summary) return null;

  return (
    <section className="ml-10 rounded-xl border border-border bg-white shadow-sm">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="flex min-h-11 w-full items-center gap-2 rounded-xl px-4 py-2.5 text-left text-sm font-semibold text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
        >
          <ClipboardList className="h-4 w-4 text-cyan" aria-hidden="true" />
          <span className="flex-1">Summary for your doctor</span>
          <ChevronDown className={cn("h-4 w-4 transition-transform motion-reduce:transition-none", open && "rotate-180")} aria-hidden="true" />
        </button>
      </h3>
      {open && (
        <div id={panelId} className="space-y-3 border-t border-border px-4 pb-4 pt-3 text-sm animate-fade-in">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Patient-reported symptoms — not a confirmed diagnosis</p>
          <p className="whitespace-pre-wrap break-words rounded-lg bg-soft-blue p-3 text-navy">{summary}</p>
          {isPatient ? (
            <p className="text-slate-700">This summary is attached to your booking when you book from this chat, so your doctor can see what you reported.</p>
          ) : (
            <p className="text-slate-700">
              You&apos;re chatting as a guest, so this summary can&apos;t be attached to a booking.{" "}
              <Link href="/login?callbackUrl=%2Fai-assistant" className="font-medium text-cyan underline-offset-4 hover:underline">
                Sign in with a patient account
              </Link>{" "}
              and start a new chat to have it shared with your doctor.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
