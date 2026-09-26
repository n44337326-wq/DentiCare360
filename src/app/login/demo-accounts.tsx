"use client";

import { Button } from "@/components/ui/button";

const DEMO_PASSWORD = "password123";
const ACCOUNTS = [
  { role: "Patient", name: "Jordan Lee", email: "patient@denticare360.com" },
  { role: "Doctor", name: "Dr. Amara Chen", email: "doctor@denticare360.com" },
  { role: "Admin", name: "Clinic admin", email: "admin@denticare360.com" },
];

/** Helper panel for the fictional demo accounts; the buttons only fill the form. */
export function DemoAccounts({
  onPick,
  disabled,
}: {
  onPick: (email: string, password: string) => void;
  disabled?: boolean;
}) {
  return (
    <section aria-labelledby="demo-heading" className="rounded-xl border border-border bg-soft-blue p-4 text-sm">
      <h2 id="demo-heading" className="font-semibold text-navy">
        Demo accounts (fictional)
      </h2>
      <p className="mt-1 text-navy/80">
        Shared password for every demo account: <code className="rounded bg-white px-1.5 py-0.5 font-mono">{DEMO_PASSWORD}</code>
      </p>
      <ul className="mt-3 space-y-2">
        {ACCOUNTS.map((a) => (
          <li key={a.email} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2">
            <span className="min-w-0">
              <span className="block font-medium text-navy">
                {a.role} <span className="font-normal text-navy/70">&middot; {a.name}</span>
              </span>
              <span className="block truncate text-xs text-navy/75">{a.email}</span>
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => onPick(a.email, DEMO_PASSWORD)}
              aria-label={`Fill the form with the ${a.role.toLowerCase()} demo account`}
            >
              Use
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
