"use client";

/**
 * useApiQuery — the iSCARB client-side data layer.
 *
 * A thin, fully-typed wrapper around TanStack Query's `useQuery` that:
 *  - namespaces every cache key under `["iscarb", ...key]` so the React Query
 *    devtools and cache stay organised,
 *  - performs a relative `fetch` to a `/api/iscarb/*` endpoint (NEVER an
 *    absolute URL — the Caddy gateway needs relative paths),
 *  - throws on non-2xx so React Query surfaces the error in its `error` field,
 *  - exposes a single `enabled` switch for conditional fetches (e.g. the
 *    per-student detail call in ReadinessView that must wait for a student to
 *    be picked).
 *
 * Every consumer gets caching (30s staleTime, 5min gcTime — configured in
 * QueryProvider), request deduplication, and background refetch-on-reconnect
 * for free, replacing the hand-rolled `useEffect + fetch` pattern that lived
 * at the top of each view.
 *
 * Usage:
 *   const { data, isLoading, error } = useApiQuery<OverviewResponse>(
 *     ["overview"],
 *     "/api/iscarb/overview",
 *   );
 *   // conditional:
 *   useApiQuery<Detail>(["readiness", studentId], `/api/iscarb/readiness?studentId=${studentId}`, { enabled: !!studentId });
 */
import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from "@tanstack/react-query";
import { getClientToken, clearClientToken } from "@/lib/client-auth";

export interface UseApiQueryOptions {
  /** When false, the query is paused (default true). */
  enabled?: boolean;
  /** Polling interval in ms (TanStack Query refetchInterval). Supports a function for dynamic intervals. */
  refetchInterval?: number | false | ((query: any) => number | false);
  /**
   * How long cached data is considered fresh (ms). Overrides the global 30s
   * default. Set 0 on pages whose data changes server-side (e.g. source-map
   * after a parse) so every mount refetches instead of showing a stale cache.
   */
  staleTime?: number;
}

export function useApiQuery<T>(
  key: string[],
  path: string,
  opts?: UseApiQueryOptions,
): UseQueryResult<T, Error> {
  return useQuery<T, Error>({
    queryKey: ["iscarb", ...key],
    refetchInterval: opts?.refetchInterval ?? false,
    staleTime: opts?.staleTime ?? 30_000,
    queryFn: async () => {
      const headers: Record<string, string> = { Accept: "application/json" };
      if (typeof window !== "undefined") {
        const token = getClientToken();
        if (token) headers["Authorization"] = `Bearer ${token}`;
        if (window.location.pathname.startsWith("/faculty")) {
          headers["x-iscarb-role"] = "faculty";
        } else if (window.location.pathname.startsWith("/student")) {
          headers["x-iscarb-role"] = "student";
        }
      }
      const res = await fetch(path, { headers });
      if (!res.ok) {
        if (res.status === 401 && typeof window !== "undefined") {
          try {
            await fetch("/api/v1/auth/logout", { method: "POST" });
          } catch {
            /* best-effort */
          }
          clearClientToken(); // drop this tab's expired token
          window.location.href = "/login";
        }
        let msg = `API ${res.status}`;
        try {
          const errData = await res.clone().json();
          if (errData && typeof errData.error === "string") {
            msg = errData.error;
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
        throw new Error(msg);
      }
      return (await res.json()) as T;
    },
    enabled: opts?.enabled ?? true,
  });
}

export interface UseApiMutationOptions<TResult, TBody> {
  method?: "POST" | "PATCH" | "DELETE" | "PUT";
  invalidateKeys?: (vars: TBody, result: TResult) => string[][];
  onSuccess?: (result: TResult, vars: TBody) => void;
  onError?: (error: Error, vars: TBody) => void;
  /** TanStack Query onMutate — run side-effects before the request fires. */
  onMutate?: (vars: TBody) => void;
}

export function useApiMutation<TResult = unknown, TBody = unknown>(
  path: string | ((vars: TBody) => string),
  opts?: UseApiMutationOptions<TResult, TBody>,
): UseMutationResult<TResult, Error, TBody> {
  const queryClient = useQueryClient();
  return useMutation<TResult, Error, TBody>({
    mutationFn: async (vars: TBody) => {
      const url = typeof path === "function" ? path(vars) : path;
      const isFormData = typeof FormData !== "undefined" && vars instanceof FormData;
      const headers: Record<string, string> = isFormData
        ? { Accept: "application/json" }
        : { "Content-Type": "application/json", Accept: "application/json" };
      if (typeof window !== "undefined") {
        const token = getClientToken();
        if (token) headers["Authorization"] = `Bearer ${token}`;
        if (window.location.pathname.startsWith("/faculty")) {
          headers["x-iscarb-role"] = "faculty";
        } else if (window.location.pathname.startsWith("/student")) {
          headers["x-iscarb-role"] = "student";
        }
      }
      const body = isFormData ? (vars as unknown as BodyInit) : JSON.stringify(vars);

      const res = await fetch(url, {
        method: opts?.method ?? "POST",
        headers,
        body,
      });
      if (!res.ok) {
        if (res.status === 401 && typeof window !== "undefined") {
          try {
            await fetch("/api/v1/auth/logout", { method: "POST" });
          } catch {
            /* best-effort */
          }
          clearClientToken(); // drop this tab's expired token
          window.location.href = "/login";
        }
        let message = `API ${res.status}`;
        try {
          const body = (await res.json()) as { error?: string };
          if (body?.error) message = body.error;
        } catch {
          /* non-JSON error body; keep the generic message */
        }
        throw new Error(message);
      }
      return (await res.json()) as TResult;
    },
    onMutate: (vars) => {
      opts?.onMutate?.(vars);
    },
    onSuccess: (result, vars) => {
      const keys = opts?.invalidateKeys?.(vars, result) ?? [];
      for (const k of keys) {
        queryClient.invalidateQueries({ queryKey: ["iscarb", ...k] });
      }
      opts?.onSuccess?.(result, vars);
    },
    onError: (error, vars) => {
      opts?.onError?.(error, vars);
    },
  });
}
