"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/** Accessible on/off switch with a visible label and optional description. */
export function ToggleSwitch({
  checked,
  onCheckedChange,
  label,
  description,
  disabled,
  className,
}: {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <p id={`${id}-label`} className="text-sm font-medium text-navy">
          {label}
        </p>
        {description && (
          <p id={`${id}-desc`} className="mt-0.5 text-xs text-slate-600">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={description ? `${id}-desc` : undefined}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "border-green bg-green" : "border-slate-300 bg-slate-200"
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "inline-block h-4 w-4 rounded-full bg-white shadow transition-transform motion-reduce:transition-none",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
        <span className="sr-only">{checked ? "On" : "Off"}</span>
      </button>
    </div>
  );
}
