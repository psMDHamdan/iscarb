"use client";

import { useApiQuery } from "@/lib/use-api-query";
import type { Role } from "@/lib/auth";

interface SessionResponse {
  role: Role;
  universityCode: string | null;
  studentId: string | null;
}

/**
 * Reads the current session (role + tenant anchors) for role-based navigation.
 * Cached/deduped by react-query so multiple callers (Sidebar, page) share one
 * request. While the role is still unknown, it defaults to the most restrictive
 * non-admin set ("student") so a privileged console never flashes for a
 * non-privileged user during the initial load.
 */
export function useSession(): {
  role: Role;
  studentId: string | null;
  universityCode: string | null;
  isLoading: boolean;
  ready: boolean;
} {
  const { data, isLoading } = useApiQuery<SessionResponse>(
    ["session"],
    "/api/iscarb/session",
  );
  return {
    role: data?.role ?? "student",
    studentId: data?.studentId ?? null,
    universityCode: data?.universityCode ?? null,
    isLoading,
    ready: !isLoading && !!data,
  };
}
