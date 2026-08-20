/**
 * Client-side auth token store — PER-TAB.
 * =======================================
 * The JWT lives in `sessionStorage`, which the browser scopes to a single tab.
 * That gives every tab its own session: logging in as a different user in a
 * second tab never overwrites (or reads) the first tab's identity, and closing
 * a tab cannot log out another tab.
 *
 * Each login already mints a unique server-side session (SessionService →
 * Redis), so the per-tab JWT maps 1:1 to a per-tab session id.
 *
 * A login also sets the shared `iscarb_session` cookie (httpOnly) so SSR /
 * middleware can gate the first page load. Once a tab has its own token, every
 * API call sends `Authorization: Bearer <token>`, which the server's getSession
 * prefers over the cookie — so per-tab identity wins on all data calls.
 *
 * Note: a literal per-tab *cookie* is impossible — browsers share cookies per
 * domain, not per tab. The per-tab token is the mechanism that achieves it.
 */
const TOKEN_KEY = "iscarb_jwt";
const LEGACY_TOKEN_KEY = "iscarb_token";
const PROFILE_KEY = "iscarb_profile";

export type ClientProfile = {
  role: string;
  name?: string;
  email?: string;
  studentId?: string;
};

export function getClientToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return (
      window.sessionStorage.getItem(TOKEN_KEY) ||
      window.sessionStorage.getItem(LEGACY_TOKEN_KEY) ||
      null
    );
  } catch {
    return null;
  }
}

export function setClientToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(TOKEN_KEY, token);
    // Keep the legacy key in sync for any view that still reads it directly.
    window.sessionStorage.setItem(LEGACY_TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
}

export function clearClientToken(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(LEGACY_TOKEN_KEY);
    // Clean up orphaned shared-storage copies from before per-tab sessions.
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(PROFILE_KEY);
  } catch {
    /* ignore */
  }
}

export function setClientProfile(profile: ClientProfile): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* ignore */
  }
}

export function getClientProfile(): ClientProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      window.sessionStorage.getItem(PROFILE_KEY) ||
      window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ClientProfile;
  } catch {
    return null;
  }
}

/** Headers for authenticated SPA fetches. */
export function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = getClientToken();
  return {
    Accept: "application/json",
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
