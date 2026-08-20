"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/services/api-client";
import type { ApiResponse, RequestOptions } from "@/types/api";

interface UseStudentDataState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  isSuccess: boolean;
}

interface UseStudentDataReturn<T> extends UseStudentDataState<T> {
  refetch: () => Promise<void>;
  mutate: (body: unknown, method?: "POST" | "PUT" | "PATCH" | "DELETE") => Promise<ApiResponse<T>>;
}

export function useStudentData<T>(
  path: string | null,
  options: RequestOptions = {},
): UseStudentDataReturn<T> {
  const [state, setState] = useState<UseStudentDataState<T>>({
    data: null,
    error: null,
    loading: !!path,
    isSuccess: false,
  });
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (!path) {
      setState({ data: null, error: null, loading: false, isSuccess: false });
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const res = await api.get<T>(path, { ...options, signal: controller.signal });

      if (controller.signal.aborted) return;

      setState({
        data: res.success ? res.data : null,
        error: res.error?.message || null,
        loading: false,
        isSuccess: res.success,
      });
    } catch (err) {
      if (!controller.signal.aborted) {
        const message = err instanceof Error ? err.message : "Failed to fetch data";
        setState({
          data: null,
          error: message,
          loading: false,
          isSuccess: false,
        });
      }
    }
  }, [path]);

  useEffect(() => {
    fetchData();
    return () => abortRef.current?.abort();
  }, [fetchData]);

  const mutate = useCallback(
    async (body: unknown, method: "POST" | "PUT" | "PATCH" | "DELETE" = "POST") => {
      if (!path) {
        return { success: false, data: null as T, error: { code: "NO_PATH", message: "No path provided" } };
      }
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const res = await api.request?.<T>(path, { method, body }) ?? (await api.post<T>(path, body));
        setState({
          data: res.success ? res.data : null,
          error: res.error?.message || null,
          loading: false,
          isSuccess: res.success,
        });
        return res;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Request failed";
        setState({
          data: null,
          error: message,
          loading: false,
          isSuccess: false,
        });
        return { success: false, data: null as T, error: { code: "ERROR", message } };
      }
    },
    [path],
  );

  return { ...state, refetch: fetchData, mutate };
}
