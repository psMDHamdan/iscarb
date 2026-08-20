import { useState, useEffect } from "react";

/**
 * Lightweight client-side fetch hook with loading/error state and reload.
 * Used by view components that need ad-hoc data fetching without React Query.
 */
export function useFetch<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(!!url);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const reload = () => setNonce((n) => n + 1);

  const key = `${url ?? "∅"}#${nonce}`;
  const [lastKey, setLastKey] = useState(key);
  if (key !== lastKey) {
    setLastKey(key);
    setError(null);
    setLoading(!!url);
    if (!url) setData(null);
  }

  useEffect(() => {
    if (!url) return;
    let alive = true;
    fetch(url, { headers: { Accept: "application/json" } })
      .then(async (r) => {
        if (!r.ok) throw new Error(`Request failed (${r.status})`);
        const j = await r.json();
        if (alive) setData(j as T);
      })
      .catch((e) => alive && setError(e?.message ?? "Failed to load"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [url, nonce]);

  return { data, loading, error, reload };
}
