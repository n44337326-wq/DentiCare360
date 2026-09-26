import Link from "next/link";
import { LockKeyhole, UserRoundX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";
import { authUrl } from "@/components/booking/booking-url";

/**
 * Booking needs a signed-in patient. Signed-out visitors get sign-in / register
 * links that return them here with every selection preserved in the URL.
 */
export function AuthGate({ role, returnUrl }: { role: Role | null; returnUrl: string }) {
  if (role && role !== "PATIENT") {
    return (
      <div role="status" className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
        <UserRoundX className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div className="space-y-2 text-sm">
          <p className="font-semibold">A patient account is required to book</p>
          <p>
            You&apos;re signed in with a {role === "DOCTOR" ? "doctor" : "administrator"} account, which can&apos;t book appointments.
            Sign in with a patient account to continue — your selections will be kept.
          </p>
          <Link href={authUrl("/login", returnUrl)} className={cn(buttonVariants({ variant: "outline" }), "h-11")}>
            Sign in as a patient
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-cyan/30 bg-cyan-light p-5">
      <div className="flex gap-3">
        <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-navy" aria-hidden="true" />
        <div className="space-y-1 text-sm text-navy">
          <p className="font-semibold">Sign in to finish booking</p>
          <p>
            We need a patient account so your appointment, reminders and payment appear in your portal. Your choices so far
            will be waiting for you when you come back.
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Link href={authUrl("/login", returnUrl)} className={cn(buttonVariants(), "h-11")}>
          Sign in
        </Link>
        <Link href={authUrl("/register", returnUrl)} className={cn(buttonVariants({ variant: "outline" }), "h-11 bg-white")}>
          Create account
        </Link>
      </div>
    </div>
  );
}
