import { ChevronDown } from "lucide-react";
import { Faq } from "@/components/content/faq";
import { AI_FAQS } from "@/content/site-content";
import { AssistantSidePanel } from "@/components/ai/assistant-side-panel";
import { ChatWindow } from "@/components/ai/chat-window";

export const metadata = {
  title: "AI Health Assistant — DentiCare360",
  description: "Describe what you're experiencing and get help finding the right specialist and appointment.",
};

export default function AiAssistantPage() {
  return (
    <div className="container-app py-6 sm:py-10">
      <div className="mb-5 max-w-3xl sm:mb-6">
        <h1 className="text-2xl font-semibold text-navy sm:text-4xl">AI Health Assistant</h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          Tell the assistant what you&apos;re experiencing in your own words. It asks a few questions, points you to the right kind of specialist
          and helps you book — it doesn&apos;t diagnose or prescribe.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <ChatWindow />
        <aside aria-label="About the AI Health Assistant" className="hidden lg:block">
          <AssistantSidePanel />
        </aside>
      </div>

      <details className="group mt-4 rounded-xl border border-border bg-white lg:hidden">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan">
          What I can and can&apos;t do, and emergencies
          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
        </summary>
        <div className="border-t border-border p-4">
          <AssistantSidePanel idPrefix="ai-m" />
        </div>
      </details>

      <div className="mt-14">
        <Faq id="ai-faq" items={AI_FAQS} title="About the AI Health Assistant" />
      </div>
    </div>
  );
}
