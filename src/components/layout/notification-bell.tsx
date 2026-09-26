"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Bell } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

const HREF_BY_ROLE: Record<string, string> = {
  PATIENT: "/patient/notifications",
  DOCTOR: "/doctor/notifications",
  ADMIN: "/admin/notifications",
};

/** Header bell with the unread count. Renders nothing for signed-out visitors. */
export function NotificationBell() {
  const { data: session } = useSession();
  const [unread, setUnread] = useState(0);
  const signedIn = !!session?.user;

  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    const load = () =>
      apiFetch<{ unread: number }>("/api/notifications")
        .then((d) => !cancelled && setUnread(d.unread))
        .catch(() => undefined);
    void load();
    window.addEventListener("notifications:changed", load);
    const timer = window.setInterval(load, 60_000);
    return () => {
      cancelled = true;
      window.removeEventListener("notifications:changed", load);
      window.clearInterval(timer);
    };
  }, [signedIn]);

  if (!signedIn) return null;
  const href = HREF_BY_ROLE[session!.user.role] ?? "/";

  return (
    <Link
      href={href}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-navy transition-colors hover:bg-soft-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
      aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
    >
      <Bell className="h-5 w-5" aria-hidden="true" />
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan px-1 text-[10px] font-semibold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
