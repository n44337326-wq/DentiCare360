import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A selectable card backed by a native radio input, so arrow-key navigation,
 * focus and screen-reader semantics come for free. Disabled cards stay visible.
 */
export function ChoiceCard({
  name,
  value,
  checked,
  disabled,
  onChange,
  children,
  className,
}: {
  name: string;
  value: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "relative flex min-h-11 items-start gap-3 rounded-xl border p-4 transition-all duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-cyan has-[:focus-visible]:ring-offset-2",
        checked ? "border-navy bg-soft-blue shadow-sm" : "border-border bg-white",
        disabled
          ? "cursor-not-allowed bg-slate-50 opacity-70"
          : cn("cursor-pointer", !checked && "hover:-translate-y-0.5 hover:border-cyan hover:shadow-md"),
        className
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange(value)}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
          checked ? "border-navy bg-navy text-white" : "border-slate-300 bg-white"
        )}
      >
        {checked && <Check className="h-3 w-3" />}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </label>
  );
}
