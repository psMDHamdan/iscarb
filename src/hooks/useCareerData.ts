"use client";

import { useEffect, useState } from "react";

interface UseCareerDataOptions {
  endpoint: string;
  method?: "GET" | "POST";
  body?: unknown;
  skip?: boolean;
}

export function useCareerData<T>(options: UseCareerDataOptions) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (options.skip) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(options.endpoint, {
          method: options.method || "GET",
          headers: { "Content-Type": "application/json" },
          body: options.body ? JSON.stringify(options.body) : undefined,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `API error: ${response.status}`);
        }

        const result = await response.json();
        setData(result.data || result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [options.endpoint, options.method, options.skip]);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(options.endpoint, {
        method: options.method || "GET",
        headers: { "Content-Type": "application/json" },
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const result = await response.json();
      setData(result.data || result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
}
