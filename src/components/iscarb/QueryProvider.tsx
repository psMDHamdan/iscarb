"use client";

/**
 * QueryProvider — the iSCARB React Query root.
 *
 * Wraps the entire app in `QueryClientProvider` with a single shared
 * `QueryClient` whose defaults are tuned for the iSCARB workload:
 *  - `staleTime: 30_000`   — matches the server `Cache-Control: s-maxage=30`
 *    on the read-heavy GET routes (overview / courses / market / challenges
 *    / agents). Sub-30s re-renders hit the cache instead of re-hitting the
 *    AI-backed routes.
 *  - `gcTime: 5 * 60_000`  — keep stale data around for 5 minutes so a user
 *    who tabs away and back can see the last snapshot while we refetch.
 *  - `refetchOnWindowFocus: false` — we explicitly do NOT want focus to
 *    trigger refetches; several routes call iSCARB AI and would be
 *    hammered every time the user alt-tabs.
 *  - `retry: 1`            — one retry on transient failures, no more.
 *
 * The hook itself lives in `@/lib/use-api-query` so views can import it
 * without pulling the provider. We re-export it from here for convenience.
 */
import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export { useApiQuery } from "@/lib/use-api-query";
export type { UseApiQueryOptions } from "@/lib/use-api-query";
export { useApiMutation } from "@/lib/use-api-query";
export type { UseApiMutationOptions } from "@/lib/use-api-query";

export function QueryProvider({ children }: { children: ReactNode }) {
  // `useState` ensures the client is created once per browser session and
  // stays stable across re-renders (a fresh client on every render would
  // wipe the cache).
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000, // 30s — matches server s-maxage
            gcTime: 5 * 60_000, // 5 min
            refetchOnWindowFocus: false, // don't hammer AI routes on alt-tab
            retry: 1, // one retry, then surface the error
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
