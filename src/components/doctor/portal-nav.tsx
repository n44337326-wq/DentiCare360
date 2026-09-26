"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Bell,
  CalendarDays,
  Clock3,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  MessagesSquare,
  Settings,
  Stethoscope,
  Users,
  type LucideIcon,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const ICONS = {
  dashboard: LayoutDashboard,
  appointments: CalendarDays,
  availability: Clock3,
  notifications: Bell,
  doctors: Stethoscope,
  patients: Users,
  services: ClipboardList,
  payments: CreditCard,
  ai: MessagesSquare,
  reports: BarChart3,
  settings: Settings,
} satisfies Record<string, LucideIcon>;

export type PortalIcon = keyof typeof ICONS;

export interface PortalNavItem {
  href: string;
  label: string;
  icon: PortalIcon;
  /** Only "/admin" needs this: it must not stay highlighted on every /admin/* page. */
  exact?: boolean;
}

/**
 * Portal navigation: a vertical sidebar on large screens, a horizontally
 * scrollable pill bar on small ones. The current page is highlighted and
 * announced with aria-current. The notifications link carries a live unread count.
 */
export function PortalNav({
  items,
  label,
  unreadHref,
  initialUnread = 0,
}: {
  items: PortalNavItem[];
  label: string;
  unreadHref?: string;
  initialUnread?: number;
}) {
  const pathname = usePathname();
  const [unread, setUnread] = useState(initialUnread);

  useEffect(() => {
    if (!unreadHref) return;
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
  }, [unreadHref]);

  return (
    <nav aria-label={label} className="-mx-5 overflow-x-auto px-5 pb-1 lg:mx-0 lg:overflow-visible lg:px-0 lg:pb-0">
      <ul className="flex gap-1 lg:flex-col">
        {items.map(({ href, label: text, icon, exact }) => {
          const Icon = ICONS[icon];
          const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
          const badge = href === unreadHref ? unread : 0;
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
                {text}
                {badge > 0 && (
                  <span
                    className={cn(
                      "ml-auto rounded-full px-1.5 text-[11px] font-semibold leading-5",
                      active ? "bg-white text-navy" : "bg-cyan text-white"
                    )}
                  >
                    {badge > 99 ? "99+" : badge}
                    <span className="sr-only"> unread</span>
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
