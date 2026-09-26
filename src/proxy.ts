import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

/**
 * First line of defence for the role dashboards: unauthenticated visitors are
 * sent to sign-in, and a signed-in user who opens another role's area is sent
 * back to their own. This is a convenience redirect — every page and API route
 * ALSO authorises on the server, so protection never depends on this file.
 */
const { auth } = NextAuth(authConfig);

const HOME_BY_ROLE = {
  PATIENT: "/patient/dashboard",
  DOCTOR: "/doctor/dashboard",
  ADMIN: "/admin",
} as const;

const AREA_ROLE: Record<string, keyof typeof HOME_BY_ROLE> = {
  "/patient": "PATIENT",
  "/doctor": "DOCTOR",
  "/admin": "ADMIN",
};

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const area = Object.keys(AREA_ROLE).find((a) => pathname === a || pathname.startsWith(`${a}/`));
  if (!area) return NextResponse.next();

  const user = req.auth?.user;
  if (!user) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }
  if (user.role !== AREA_ROLE[area]) {
    return NextResponse.redirect(new URL(HOME_BY_ROLE[user.role] ?? "/", req.nextUrl.origin));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/patient/:path*", "/doctor/:path*", "/admin/:path*"],
};
