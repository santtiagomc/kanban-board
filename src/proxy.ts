// Runs before every request that matches `config.matcher` below.
//
// In Next.js 16 this file used to be called middleware.ts. Same behaviour,
// new name.
//
// IMPORTANT - this is an OPTIMISTIC check, not real authorization. It only
// asks "is there a session cookie?", never "is that cookie valid?". A forged
// or expired cookie passes right through. The real check lives in each page
// and API route with auth(), which verifies the signature.
//
// Two reasons it works this way:
//   1. Next's own docs say proxy is not a session management solution
//   2. This file runs in a restricted runtime where Prisma cannot run, so it
//      could not verify anything against the database even if we wanted to

import { NextResponse, type NextRequest } from "next/server";

// Auth.js names the cookie "authjs.session-token", and prefixes it with
// "__Secure-" when served over HTTPS. Production will use the second one.
const SESSION_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

// Pages that only make sense when signed out.
const AUTH_PAGES = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasSessionCookie = SESSION_COOKIE_NAMES.some((name) =>
    request.cookies.has(name),
  );

  const isAuthPage = AUTH_PAGES.includes(pathname);

  // Signed out and asking for a private page -> send to sign in.
  if (!hasSessionCookie && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Already signed in and asking for the sign-in page -> send to the boards.
  // Without this, a signed-in user could sit on a login form for no reason.
  if (hasSessionCookie && isAuthPage) {
    return NextResponse.redirect(new URL("/boards", request.url));
  }

  // Everything is fine: let the request continue as usual.
  return NextResponse.next();
}

export const config = {
  // Only these paths go through this file. Everything else (the home page,
  // static assets, /api/auth/*) skips it entirely, which keeps it cheap.
  matcher: ["/boards/:path*", "/login", "/register"],
};
