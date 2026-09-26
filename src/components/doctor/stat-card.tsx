import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TONES = {
  cyan: "bg-cyan-light text-cyan",
  navy: "bg-soft-blue text-navy",
  green: "bg-green-light text-green",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-700",
} as const;

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "cyan",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: keyof typeof TONES;
}) {
  return (
    <Card className="transition-all hover:-translate-y-0.5">
      <CardContent className="flex items-center gap-3 p-5">
        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg", TONES[tone])}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-2xl font-semibold text-navy">{value}</p>
          <p className="text-xs text-slate-600">{label}</p>
          {hint && <p className="text-xs text-slate-600">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
