"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, CalendarDays, CreditCard, FileText, HeartPulse, LayoutDashboard } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/patient/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/patient/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/patient/health-profile", label: "Health Profile", icon: HeartPulse },
  { href: "/patient/documents", label: "Documents", icon: FileText },
  { href: "/patient/payments", label: "Payments", icon: CreditCard },
  { href: "/patient/notifications", label: "Notifications", icon: Bell },
] as const;

/** Portal navigation: a vertical sidebar on desktop, a horizontally scrollable pill bar on mobile. */
export function PortalNav({ initialUnread }: { initialUnread: number }) {
  const pathname = usePathname();
  const [unread, setUnread] = useState(initialUnread);

  // Stay in sync with the mark-as-read actions in the notifications list.
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      apiFetch<{ unread: number }>("/api/notifications")
        .then((d) => !cancelled && setUnread(d.unread))
        .catch(() => undefined);
    window.addEventListener("notifications:changed", load);
    return () => {
      cancelled = true;
      window.removeEventListener("notifications:changed", load);
    };
  }, []);

  return (
    <nav aria-label="Patient portal" className="-mx-5 overflow-x-auto px-5 lg:mx-0 lg:overflow-visible lg:px-0">
      <ul className="flex gap-2 lg:flex-col lg:gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const count = href === "/patient/notifications" ? unread : 0;
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan",
                  active ? "bg-navy text-white shadow-sm" : "text-navy hover:bg-soft-blue"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
                {count > 0 && (
                  <span
                    className={cn(
                      "ml-auto rounded-full px-1.5 text-[11px] font-semibold leading-5",
                      active ? "bg-white text-navy" : "bg-cyan text-white"
                    )}
                  >
                    <span aria-hidden="true">{count > 9 ? "9+" : count}</span>
                    <span className="sr-only">{count} unread</span>
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
