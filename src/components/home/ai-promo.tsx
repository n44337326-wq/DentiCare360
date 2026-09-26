import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { AI_DISCLAIMER } from "@/lib/ai-assistant";
import { Button } from "@/components/ui/button";

export function AiPromo() {
  return (
    <section aria-labelledby="ai-heading" className="container-app py-16">
      <div className="grid gap-10 rounded-2xl bg-navy p-8 text-white sm:p-12 lg:grid-cols-2 lg:items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
            <Sparkles className="h-3.5 w-3.5 text-cyan" aria-hidden="true" /> AI Health Assistant
          </span>
          <h2 id="ai-heading" className="mt-4 text-3xl font-semibold sm:text-4xl">
            Not sure who to consult?
          </h2>
          <p className="mt-3 max-w-md text-lg text-white/80">
            Tell our AI Health Assistant what you&apos;re experiencing and we&apos;ll help you find the right next step.
          </p>
          <Button size="lg" variant="secondary" asChild className="mt-7 bg-white text-navy hover:bg-white/90">
            <Link href="/ai-assistant">
              Start AI Assistant <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
          <p className="mt-5 max-w-md text-sm text-white/75">{AI_DISCLAIMER}</p>
        </div>

        <div aria-hidden="true" className="rounded-xl bg-white/5 p-5 ring-1 ring-white/10">
          <div className="flex flex-col gap-3 text-sm">
            <p className="w-fit max-w-[85%] rounded-2xl rounded-bl-sm bg-white/10 px-4 py-2">
              I have had tooth pain for three days.
            </p>
            <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-white px-4 py-2 text-navy">
              I&apos;m sorry to hear that. Does it get worse with hot or cold food, or when you bite down?
            </p>
            <p className="w-fit max-w-[85%] rounded-2xl rounded-bl-sm bg-white/10 px-4 py-2">
              It&apos;s constant and worse at night.
            </p>
            <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-white px-4 py-2 text-navy">
              A dental consultation would be a good next step. This is general guidance, not a diagnosis. I can show you
              the next available appointments.
            </p>
          </div>
          <p className="mt-4 text-center text-xs text-white/65">Illustrative example</p>
        </div>
      </div>
    </section>
  );
}
