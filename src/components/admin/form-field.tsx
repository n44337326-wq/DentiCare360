import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Label + control + hint + linked error message. The control must set
 * `id={id}`, `aria-invalid` and `aria-describedby={`${id}-err`}` when `error` is set.
 */
export function Field({
  id,
  label,
  error,
  hint,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-slate-600">{hint}</p>}
      {error && (
        <p id={`${id}-err`} role="alert" className="text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export const invalidClass = (error?: string) => (error ? "border-red-500 focus-visible:ring-red-500" : undefined);
