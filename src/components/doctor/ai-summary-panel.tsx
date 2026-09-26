import { ChevronDown, Sparkles } from "lucide-react";

/**
 * AI-derived symptom summary. It is ALWAYS labelled as patient-reported and
 * never presented as a diagnosis. Native <details> keeps it keyboard- and
 * screen-reader-accessible without any script.
 */
export function AiSummaryPanel({ summary, defaultOpen = false }: { summary: string; defaultOpen?: boolean }) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-lg border border-cyan/30 bg-cyan-light/60 text-sm open:bg-cyan-light"
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-3 py-2 font-medium text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan [&::-webkit-details-marker]:hidden">
        <Sparkles className="h-4 w-4 shrink-0 text-cyan" aria-hidden="true" />
        <span className="flex-1">
          <span className="block">Patient-reported symptoms</span>
          <span className="block text-xs font-normal text-slate-700">Not a confirmed diagnosis</span>
        </span>
        <ChevronDown
          className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
          aria-hidden="true"
        />
      </summary>
      <div className="border-t border-cyan/20 px-3 py-3">
        <p className="text-xs font-medium text-slate-700">
          Reported by the patient via the AI Health Assistant — not a confirmed diagnosis
        </p>
        <p className="mt-2 whitespace-pre-line text-navy">{summary}</p>
      </div>
    </details>
  );
}
