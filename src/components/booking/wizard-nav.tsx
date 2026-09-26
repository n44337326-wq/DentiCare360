import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Back / Continue controls: a sticky bottom bar on phones, inline on desktop. Targets are 48px tall. */
export function WizardNav({
  canBack,
  canNext,
  nextLabel,
  pending,
  hint,
  onBack,
  onNext,
}: {
  canBack: boolean;
  canNext: boolean;
  nextLabel: string;
  pending: boolean;
  hint?: string | null;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-white px-4 py-3 shadow-[0_-4px_16px_rgba(11,37,69,0.08)] lg:static lg:z-auto lg:mt-8 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
      {hint && !canNext && <p className="mb-2 text-center text-xs text-slate-600 lg:text-right">{hint}</p>}
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 lg:max-w-none">
        <Button type="button" variant="outline" size="lg" onClick={onBack} disabled={!canBack || pending} className="min-w-28">
          <ArrowLeft /> Back
        </Button>
        <Button type="button" size="lg" onClick={onNext} disabled={!canNext || pending} aria-busy={pending} className="flex-1 sm:flex-none sm:min-w-48">
          {pending ? (
            <>
              <Loader2 className="animate-spin motion-reduce:animate-none" /> Confirming…
            </>
          ) : (
            <>
              {nextLabel} {nextLabel !== "Confirm booking" && <ArrowRight />}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
