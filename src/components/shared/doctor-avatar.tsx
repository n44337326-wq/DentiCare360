import { cn } from "@/lib/utils";

const SIZES = {
  sm: "h-9 w-9 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-20 w-20 text-xl",
  xl: "h-28 w-28 text-3xl",
} as const;

// A restrained set of brand tints, picked deterministically from the name so a doctor keeps the same avatar everywhere.
const TINTS = [
  "bg-navy text-white",
  "bg-navy-light text-white",
  "bg-cyan text-white",
  "bg-green text-white",
  "bg-soft-blue text-navy ring-1 ring-navy/10",
];

export function initials(name: string) {
  return name
    .replace(/^Dr\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

function tintFor(name: string) {
  return "bg-cyan text-white";
}

/** Doctor photo, or a monogram avatar when no photo is on file. The image (if any) is decorative: the name is always rendered nearby. */
export function DoctorAvatar({
  name,
  photoUrl,
  size = "md",
  className,
}: {
  name: string;
  photoUrl?: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photoUrl} alt="" className={cn("shrink-0 rounded-full object-cover", SIZES[size], className)} />;
  }
  return (
    <span
      aria-hidden="true"
      className={cn("flex shrink-0 items-center justify-center rounded-full font-semibold", SIZES[size], tintFor(name), className)}
    >
      {initials(name)}
    </span>
  );
}
