import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * iSCARB Route Access Control & Feature Locking Middleware
 * 1. Post-login: Redirects logged-in users from /login → employability assessment.
 *    /signup stays open (session cleared) so new accounts can be created.
 * 2. Assessment gate: unauthenticated users hitting /assessment* go to /login.
 * 3. Feature lock: other product routes rewrite to /coming-soon.
 *
 * Important: cookie *presence* is not enough — an expired/malformed JWT used to
 * bounce login ↔ assessment forever (session API 401 → /login → middleware
 * redirected back to assessment). We only treat a token as authenticated when
 * it has a valid JWT shape and a future `exp`.
 */

const ALLOWED_EXACT_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/coming-soon",
  "/forgot-password",
  "/reset-password",
  "/terms",
  "/privacy",
  "/robots.txt",
  "/sitemap.xml",
  "/sitemap",
];

const ALLOWED_PREFIXES = [
  "/assessment",
  "/student",
  "/faculty",
  "/api",
];

const SESSION_COOKIES = ["iscarb_session", "next-auth.session-token"] as const;

function readSessionToken(request: NextRequest): string | undefined {
  for (const name of SESSION_COOKIES) {
    const value = request.cookies.get(name)?.value;
    if (value) return value;
  }
  return undefined;
}

/** Edge-safe JWT usability check (shape + exp). Does not verify signature. */
function isSessionTokenUsable(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const parts = token.split(".");
    if (parts.length !== 3 || !parts[1]) return false;
    const payloadB64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad =
      payloadB64.length % 4 === 0 ? "" : "=".repeat(4 - (payloadB64.length % 4));
    const json = atob(payloadB64 + pad);
    const payload = JSON.parse(json) as { exp?: unknown };
    if (typeof payload.exp !== "number") return false;
    // 30s clock-skew grace
    return payload.exp * 1000 > Date.now() - 30_000;
  } catch {
    return false;
  }
}

/** Decodes role from token to route properly */
function decodeRoleFromToken(token: string | undefined): string | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3 || !parts[1]) return null;
    const payloadB64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = payloadB64.length % 4 === 0 ? "" : "=".repeat(4 - (payloadB64.length % 4));
    const json = atob(payloadB64 + pad);
    const payload = JSON.parse(json) as { role?: string };
    return payload.role || null;
  } catch {
    return null;
  }
}

function clearSessionCookies(res: NextResponse) {
  for (const name of SESSION_COOKIES) {
    res.cookies.set(name, "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
      sameSite: "lax",
    });
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = readSessionToken(request);
  const authenticated = isSessionTokenUsable(token);

  // Drop unusable cookies so login is reachable and the 401↔redirect loop stops.
  if (token && !authenticated) {
    if (pathname === "/login" || pathname === "/signup") {
      const res = NextResponse.next();
      clearSessionCookies(res);
      return res;
    }
    if (
      pathname === "/assessment" ||
      pathname.startsWith("/assessment/") ||
      pathname.startsWith("/student/results") ||
      pathname.startsWith("/student/assessment") ||
      pathname === "/student/profile" ||
      pathname.startsWith("/student/profile/")
    ) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      const res = NextResponse.redirect(loginUrl);
      clearSessionCookies(res);
      return res;
    }
  }

  // Legacy personal hub → live profile page
  if (
    pathname === "/student/personal" ||
    pathname.startsWith("/student/personal/")
  ) {
    if (!authenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", "/student/profile");
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.redirect(new URL("/student/profile", request.url));
  }

  // Logged-in users navigating to /login or /signup will be redirected to their workspace
  if (authenticated && (pathname === "/login" || pathname === "/signup")) {
    const role = decodeRoleFromToken(token);
    if (role === "faculty" || role === "admin") {
      return NextResponse.redirect(new URL("/faculty/lecture", request.url));
    }
    return NextResponse.redirect(new URL("/assessment/employability", request.url));
  }

  // Assessment surfaces require a usable session.
  // Student & Assessment surfaces require a usable session.
  if (
    (pathname === "/assessment" ||
      pathname.startsWith("/assessment/") ||
      pathname.startsWith("/student")) &&
    !authenticated
  ) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Faculty surfaces require authentication — AC-11: unauthenticated /faculty
  // must redirect to /login, not serve an open 200 HTML page.
  if (
    (pathname === "/faculty" || pathname.startsWith("/faculty/")) &&
    !authenticated
  ) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isExactAllowed = ALLOWED_EXACT_ROUTES.includes(pathname);
  const isPrefixAllowed = ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
  );

  if (!isExactAllowed && !isPrefixAllowed) {
    // Return a proper 404 instead of rewriting to /coming-soon with HTTP 200
    return new NextResponse("Not Found", { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|txt|xml)$).*)",
  ],
};
