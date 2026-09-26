import * as React from "react";
import { Label } from "@/components/ui/label";

/** Label + control + hint + error, wired together with htmlFor / aria-describedby / aria-invalid. */
export function FormField({
  id,
  label,
  error,
  hint,
  optional,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  /** Render-prop so the control receives the right aria attributes. */
  children: (props: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => React.ReactNode;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {label}
        {optional && <span className="ml-1 font-normal text-navy/65">(optional)</span>}
      </Label>
      {children({ id, "aria-invalid": !!error, "aria-describedby": describedBy })}
      {hint && (
        <p id={hintId} className="text-xs text-navy/70">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
