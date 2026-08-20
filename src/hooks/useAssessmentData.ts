import { useState, useEffect } from "react";
import { useSession } from "@/lib/use-session";
import { authHeaders } from "@/lib/client-auth";

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages?: number;
}

interface UseFetchOptions {
  page?: number;
  limit?: number;
  [key: string]: any;
}

export function useAssessmentData<T>(endpoint: string, options: UseFetchOptions = {}) {
  const session = useSession();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, limit: 20 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        Object.entries(options).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });

        const url = `${endpoint}${params.toString() ? `?${params}` : ""}`;
        const response = await fetch(url, {
          headers: await authHeaders(),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch from ${endpoint}`);
        }

        const result = await response.json();
        if (result.success) {
          setData(result.data);
          if (result.meta) {
            setMeta(result.meta);
          }
          setError(null);
        } else {
          setError(result.error || "Failed to load data");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint, JSON.stringify(options)]);

  return { data, loading, error, meta };
}

export function useSingleAssessmentData<T>(endpoint: string) {
  const session = useSession();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(endpoint, {
          headers: await authHeaders(),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch from ${endpoint}`);
        }

        const result = await response.json();
        if (result.success) {
          setData(result.data);
          setError(null);
        } else {
          setError(result.error || "Failed to load data");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint]);

  return { data, loading, error };
}
