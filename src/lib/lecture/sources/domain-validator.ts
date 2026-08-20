/**
 * Official Sources Hub — domain validator (NFR-11).
 * ===========================================================================
 * Enforces the official-domains allow-list. A URL whose host is not in
 * ALLOWED_DOMAINS is rejected; any redirect to a disallowed host is also
 * blocked. All rejections are surfaced so the caller can audit immediately.
 */
import { ALLOWED_DOMAINS } from "./types";

export class DomainBlockedError extends Error {
  constructor(
    public readonly url: string,
    public readonly reason: string
  ) {
    super(`Blocked domain: ${url} (${reason})`);
    this.name = "DomainBlockedError";
  }
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

/** Exact host or a subdomain of an allowed domain. */
export function isAllowedDomain(url: string): boolean {
  const host = hostOf(url);
  if (!host) return false;
  return ALLOWED_DOMAINS.some(
    (d) => host === d || host.endsWith(`.${d}`)
  );
}

/** NFR-11 — throw if the requested URL is outside the allow-list. */
export function assertAllowedUrl(url: string): void {
  if (!isAllowedDomain(url)) {
    throw new DomainBlockedError(url, "host not in ALLOWED_DOMAINS");
  }
}

/** NFR-11 — verify a redirect target stays inside the allow-list. */
export function assertAllowedRedirect(originalUrl: string, finalUrl: string): void {
  if (!isAllowedDomain(finalUrl)) {
    throw new DomainBlockedError(originalUrl, `redirected to disallowed host: ${finalUrl}`);
  }
}
