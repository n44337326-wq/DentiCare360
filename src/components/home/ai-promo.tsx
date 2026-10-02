import Link from "next/link";
import { ArrowRight, Bot, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { AI_DISCLAIMER } from "@/lib/ai-assistant";
import { Button } from "@/components/ui/button";

export function AiPromo() {
  return (
    <section aria-labelledby="ai-heading" className="container-app py-16">
      <div className="relative grid gap-10 overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-navy to-navy-light p-8 text-white shadow-xl shadow-navy/20 sm:p-12 lg:grid-cols-2 lg:items-center">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-cyan/25 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-1/3 h-60 w-60 rounded-full bg-blue/20 blur-3xl" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative animate-fade-in-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 text-xs font-semibold text-white">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan" />
            </span>
            <Sparkles className="h-3.5 w-3.5 text-cyan" aria-hidden="true" /> AI Health Assistant
          </span>
          <h2 id="ai-heading" className="mt-4 text-3xl font-semibold sm:text-4xl">
            Not sure who to{" "}
            <span className="bg-gradient-to-r from-cyan to-white bg-clip-text text-transparent">consult?</span>
          </h2>
          <p className="mt-3 max-w-md text-lg text-white/80">
            Tell our AI Health Assistant what you&apos;re experiencing and we&apos;ll help you find the right next step.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Button
              size="lg"
              asChild
              className="group relative overflow-hidden bg-gradient-to-r from-cyan to-blue font-bold text-white shadow-lg shadow-cyan/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan/40"
            >
              <Link href="/ai-assistant">
                <span
                  aria-hidden="true"
                  className="absolute inset-y-0 -left-full w-1/2 skew-x-[-20deg] bg-white/30 transition-all duration-700 group-hover:left-[150%]"
                />
                <span className="relative flex items-center gap-2">
                  Start AI Assistant
                  <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </Link>
            </Button>
            <ul className="flex flex-col gap-1 text-sm text-white/80">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-cyan" aria-hidden="true" /> Free, no sign-up needed
              </li>
              <li className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-cyan" aria-hidden="true" /> Takes under a minute
              </li>
            </ul>
          </div>
          <p className="mt-5 max-w-md text-sm text-white/70">{AI_DISCLAIMER}</p>
        </div>

        <div className="relative animate-fade-in-up" style={{ animationDelay: "150ms" }}>
          <div
            aria-hidden="true"
            className="overflow-hidden rounded-xl bg-white/10 shadow-2xl shadow-black/30 ring-1 ring-white/20 backdrop-blur-md"
          >
            <div className="flex items-center gap-2.5 border-b border-white/10 bg-white/5 px-4 py-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan to-blue">
                <Bot className="h-4 w-4 text-white" />
              </span>
              <span className="text-sm font-semibold">DentiCare AI</span>
              <span className="ml-auto flex items-center gap-1.5 text-xs text-white/70">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green" /> Online
              </span>
            </div>
            <div className="flex flex-col gap-3 p-5 text-sm">
              <p className="animate-fade-in-up w-fit max-w-[85%] rounded-2xl rounded-bl-sm bg-white/10 px-4 py-2" style={{ animationDelay: "300ms" }}>
                I have had tooth pain for three days.
              </p>
              <p className="animate-fade-in-up ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-white px-4 py-2 text-navy shadow-md" style={{ animationDelay: "700ms" }}>
                I&apos;m sorry to hear that. Does it get worse with hot or cold food, or when you bite down?
              </p>
              <p className="animate-fade-in-up w-fit max-w-[85%] rounded-2xl rounded-bl-sm bg-white/10 px-4 py-2" style={{ animationDelay: "1100ms" }}>
                It&apos;s constant and worse at night.
              </p>
              <p className="animate-fade-in-up ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-white px-4 py-2 text-navy shadow-md" style={{ animationDelay: "1500ms" }}>
                A dental consultation would be a good next step. This is general guidance, not a diagnosis. I can show you
                the next available appointments.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
