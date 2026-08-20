"use client";

import { useEffect, useState, useCallback } from "react";

/**
 * useIscarbFetch — the one client-side GET helper for iSCARB views.
 *
 * Replaces the per-view `useJSON` copies that had drifted into JourneyView and
 * CommunityView. Relative fetch to a `/api/iscarb/*` endpoint, JSON-or-null, with
 * a `refresh()` to re-pull after a mutation and a `dep` to refetch on change.
 * (Heavier data needs still use the TanStack-Query `useApiQuery`; this is the
 * lightweight option for the newer feature views.)
 */
export function useIscarbFetch<T>(url: string | null, dep: unknown = 0) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!url); // true while the first fetch is pending
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!url) return;
    let alive = true;
    setLoading(true);
    fetch(url, { headers: { Accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => alive && setData(j as T))
      .catch(() => alive && setData(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [url, dep, nonce]);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);
  return { data, loading, setData, refresh };
}

/** POST/PATCH/DELETE JSON to a `/api/iscarb/*` endpoint; returns parsed JSON or null. */
export async function iscarbMutate<T = unknown>(url: string, body: unknown, method: "POST" | "PATCH" | "DELETE" = "POST"): Promise<T | null> {
  const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return r.ok ? ((await r.json()) as T) : null;
}
