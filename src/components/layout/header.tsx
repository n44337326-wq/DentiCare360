"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/layout/notification-bell";
import { cn } from "@/lib/utils";

const DASHBOARD_BY_ROLE: Record<string, string> = {
  PATIENT: "/patient/dashboard",
  DOCTOR: "/doctor/dashboard",
  ADMIN: "/admin",
};

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/doctors", label: "Doctors" },
  { href: "/ai-assistant", label: "AI Assistant" },
  { href: "/appointments/book", label: "Appointments" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

function isCurrent(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  // "Appointments" points at the booking page but should stay highlighted across /appointments/*.
  const base = href === "/appointments/book" ? "/appointments" : href;
  return pathname === base || pathname.startsWith(`${base}/`);
}

export function Header() {
  const pathname = usePathname();
  // Remember the path the menu was opened on: navigating elsewhere closes it without an effect.
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const toggleRef = useRef<HTMLButtonElement>(null);
  const { data: session, status } = useSession();
  const dashboardHref = session?.user?.role ? DASHBOARD_BY_ROLE[session.user.role] : undefined;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenAt(null);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => setOpenAt(null);
  const signOutAndHome = () => signOut({ callbackUrl: "/" });

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur-sm">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-md focus:bg-navy focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to main content
      </a>
      <div className="container-app flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md font-semibold text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
          aria-label="DentiCare360 home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy text-white">
            <Stethoscope className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-lg">
            DentiCare<span className="text-cyan">360</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => {
            const current = isCurrent(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan",
                  current ? "bg-soft-blue text-navy" : "text-navy/80 hover:bg-soft-blue hover:text-navy"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 xl:flex">
          {status !== "loading" &&
            (session?.user ? (
              <>
                <NotificationBell />
                <Button variant="outline" size="sm" asChild>
                  <Link href={dashboardHref ?? "/"}>Dashboard</Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={signOutAndHome}>
                  Sign Out
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            ))}
          <Button size="sm" asChild>
            <Link href="/appointments/book">Book Appointment</Link>
          </Button>
        </div>

        <div className="flex items-center gap-1 xl:hidden">
          {session?.user && <NotificationBell />}
          <button
            ref={toggleRef}
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-navy hover:bg-soft-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
            onClick={() => setOpenAt(open ? null : pathname)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div id="mobile-menu" hidden={!open} className="border-t border-border bg-white xl:hidden">
        <nav className="container-app flex flex-col gap-1 py-3" aria-label="Mobile primary">
          {NAV_LINKS.map((link) => {
            const current = isCurrent(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={close}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan",
                  current ? "bg-soft-blue text-navy" : "text-navy hover:bg-soft-blue"
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
            {status !== "loading" &&
              (session?.user ? (
                <>
                  <Button variant="outline" asChild>
                    <Link href={dashboardHref ?? "/"} onClick={close}>
                      Dashboard
                    </Link>
                  </Button>
                  <Button variant="ghost" onClick={signOutAndHome}>
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button variant="outline" asChild>
                  <Link href="/login" onClick={close}>
                    Sign In
                  </Link>
                </Button>
              ))}
            <Button asChild>
              <Link href="/appointments/book" onClick={close}>
                Book Appointment
              </Link>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
