import { Check, Siren, X } from "lucide-react";
import { EMERGENCY_NOTICE } from "@/lib/ai-assistant";

const CAN = [
  "Ask about your symptoms and suggest the right kind of specialist",
  "Share general, educational health information",
  "Show doctors and their next available appointments",
  "Pass a patient-reported summary to your doctor when you book",
];
const CANNOT = [
  "Diagnose a condition or confirm what is wrong",
  "Prescribe, recommend or change medicines or doses",
  "Handle emergencies — it can't examine you",
  "Replace a visit with a doctor, dentist or dermatologist",
];

/** "What I can help with", "What I can't do" and emergency guidance. */
export function AssistantSidePanel({ idPrefix = "ai" }: { idPrefix?: string }) {
  return (
    <div className="space-y-4">
      <section aria-labelledby={`${idPrefix}-can`} className="rounded-xl border border-border bg-white p-5">
        <h2 id={`${idPrefix}-can`} className="mb-3 text-base font-semibold text-navy">
          What I can help with
        </h2>
        <ul className="space-y-2 text-sm text-slate-700">
          {CAN.map((item) => (
            <li key={item} className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-green" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby={`${idPrefix}-cannot`} className="rounded-xl border border-border bg-white p-5">
        <h2 id={`${idPrefix}-cannot`} className="mb-3 text-base font-semibold text-navy">
          What I can&apos;t do
        </h2>
        <ul className="space-y-2 text-sm text-slate-700">
          {CANNOT.map((item) => (
            <li key={item} className="flex gap-2">
              <X className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby={`${idPrefix}-emergency`} className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-900">
        <h2 id={`${idPrefix}-emergency`} className="mb-2 flex items-center gap-2 text-base font-semibold">
          <Siren className="h-5 w-5 text-red-600" aria-hidden="true" />
          In an emergency
        </h2>
        <p className="text-sm">{EMERGENCY_NOTICE}</p>
        <p className="mt-2 text-sm">Signs such as chest pain, trouble breathing or swallowing, heavy bleeding or a rapidly swelling face need urgent care.</p>
      </section>
    </div>
  );
}
