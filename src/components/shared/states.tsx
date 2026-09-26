import * as React from "react";
import { AlertCircle, CheckCircle2, Info, Inbox, Loader2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Consistent loading / empty / error / success presentations used across every feature. */

export function LoadingState({ label = "Loading…", className }: { label?: string; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={cn("flex items-center justify-center gap-2 py-10 text-sm text-muted", className)}>
      <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function SkeletonRows({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)} role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-xl bg-soft-blue motion-reduce:animate-none" />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = Inbox,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center rounded-xl border border-dashed border-border bg-white px-6 py-10 text-center", className)}>
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-soft-blue text-navy">
        <Icon className="h-5 w-5" />
      </span>
      <p className="font-medium text-navy">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message = "Something went wrong.",
  onRetry,
  className,
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div role="alert" className={cn("flex flex-col items-center rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center", className)}>
      <AlertCircle className="mb-2 h-6 w-6 text-red-600" aria-hidden="true" />
      <p className="text-sm font-medium text-red-800">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

type AlertVariant = "success" | "error" | "info" | "warning";

const ALERT_STYLES: Record<AlertVariant, { box: string; icon: React.ComponentType<{ className?: string }> }> = {
  success: { box: "border-green/30 bg-green-light text-green-900", icon: CheckCircle2 },
  error: { box: "border-red-200 bg-red-50 text-red-800", icon: AlertCircle },
  info: { box: "border-cyan/30 bg-cyan-light text-navy", icon: Info },
  warning: { box: "border-amber-200 bg-amber-50 text-amber-900", icon: TriangleAlert },
};

/** Inline feedback banner. Errors are announced assertively; other variants politely. */
export function InlineAlert({
  variant = "info",
  title,
  children,
  className,
}: {
  variant?: AlertVariant;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const { box, icon: Icon } = ALERT_STYLES[variant];
  return (
    <div role={variant === "error" ? "alert" : "status"} className={cn("flex gap-3 rounded-lg border px-4 py-3 text-sm", box, className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div>
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={title ? "mt-0.5" : undefined}>{children}</div>}
      </div>
    </div>
  );
}
