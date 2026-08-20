// ═══════════════════════════════════════════════════════════════════════════════
// iSCARB — useApi Hook
// Centralized data-fetching hook with loading, error, and refetch support.
// ═══════════════════════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/services/api-client';
import type { ApiResponse, RequestOptions } from '@/types/api';

interface UseApiState<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  isSuccess: boolean;
}

interface UseApiReturn<T> extends UseApiState<T> {
  refetch: () => Promise<void>;
  mutate: (body: unknown, method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE') => Promise<ApiResponse<T>>;
}

export function useApi<T>(
  path: string | null,
  options: RequestOptions = {},
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    error: null,
    isLoading: !!path,
    isSuccess: false,
  });
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (!path) {
      setState({ data: null, error: null, isLoading: false, isSuccess: false });
      return;
    }

    // Cancel previous request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((s) => ({ ...s, isLoading: true, error: null }));

    const res = await api.get<T>(path, { ...options, signal: controller.signal });

    if (controller.signal.aborted) return;

    setState({
      data: res.success ? res.data : null,
      error: res.error?.message || null,
      isLoading: false,
      isSuccess: res.success,
    });
  }, [path]);

  useEffect(() => {
    fetchData();
    return () => abortRef.current?.abort();
  }, [fetchData]);

  const mutate = useCallback(
    async (body: unknown, method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST') => {
      if (!path) {
        return { success: false, data: null as T, error: { code: 'NO_PATH', message: 'No path provided' } };
      }
      setState((s) => ({ ...s, isLoading: true, error: null }));
      const res = await api.request?.<T>(path, { method, body }) ?? await api.post<T>(path, body);
      setState({
        data: res.success ? res.data : null,
        error: res.error?.message || null,
        isLoading: false,
        isSuccess: res.success,
      });
      return res;
    },
    [path],
  );

  return { ...state, refetch: fetchData, mutate };
}
