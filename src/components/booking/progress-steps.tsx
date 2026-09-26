import { Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { STEPS, STEP_COUNT } from "@/components/booking/steps";

/**
 * Step indicator. Desktop shows every named step (completed steps that are still
 * reachable are buttons); mobile shows "Step 3 of 7 · Doctor" with a progress bar.
 * The current step is announced through a polite live region.
 */
export function ProgressSteps({
  step,
  reachable,
  complete,
  onSelect,
}: {
  step: number;
  reachable: number;
  complete: boolean;
  onSelect: (step: number) => void;
}) {
  const current = STEPS[step - 1];
  return (
    <nav aria-label="Booking progress">
      <p className="sr-only" role="status" aria-live="polite">
        {complete ? "Booking confirmed." : `Step ${step} of ${STEP_COUNT}: ${current.label}`}
      </p>

      <div className="md:hidden" aria-hidden="true">
        <div className="mb-2 flex items-baseline justify-between text-sm">
          <span className="font-semibold text-navy">
            {complete ? "Booked" : `Step ${step} of ${STEP_COUNT}`}
          </span>
          {!complete && <span className="text-muted">{current.label}</span>}
        </div>
        <Progress value={complete ? 100 : (step / STEP_COUNT) * 100} className="h-1.5" />
      </div>

      <ol className="hidden items-start md:flex">
        {STEPS.map((meta, i) => {
          const n = i + 1;
          const done = complete || n < step;
          const isCurrent = !complete && n === step;
          const clickable = !complete && !isCurrent && n <= reachable;
          const badge = (
            <>
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-300",
                  done && "bg-green text-white",
                  isCurrent && "bg-navy text-white",
                  !done && !isCurrent && "bg-soft-blue text-navy"
                )}
              >
                {done ? <Check className="h-4 w-4" aria-hidden="true" /> : n}
              </span>
              <span className={cn("mt-1.5 text-xs", isCurrent ? "font-semibold text-navy" : "text-slate-600")}>
                {meta.label}
                {done && <span className="sr-only"> (completed)</span>}
              </span>
            </>
          );
          return (
            <li key={meta.label} className="flex flex-1 items-start last:flex-none">
              {clickable ? (
                <button
                  type="button"
                  onClick={() => onSelect(n)}
                  className="flex flex-col items-center rounded-md px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
                >
                  {badge}
                </button>
              ) : (
                <div aria-current={isCurrent ? "step" : undefined} className="flex flex-col items-center px-1">
                  {badge}
                </div>
              )}
              {n < STEP_COUNT && (
                <div className={cn("mx-1 mt-4 h-0.5 flex-1 rounded transition-colors duration-300", n < step || complete ? "bg-green" : "bg-soft-blue")} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
