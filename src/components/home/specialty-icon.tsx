import { Baby, ScanFace, ShieldCheck, Smile, Sparkles, Stethoscope, type LucideIcon } from "lucide-react";

// Icon names are stored on each specialty row in the database.
const ICONS: Record<string, LucideIcon> = { Smile, Sparkles, ScanFace, Stethoscope, Baby, ShieldCheck };

export function SpecialtyIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Stethoscope;
  return <Icon className={className} aria-hidden="true" />;
}
