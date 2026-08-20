"use client";

import { useEffect, useState } from "react";
import { getClientProfile } from "@/lib/client-auth";

export interface SessionData {
  studentId: string | null;
  userId: string | null;
  role: string;
  email: string | null;
  isLoading: boolean;
  ready: boolean;
}

export function useSession(): SessionData {
  const [session, setSession] = useState<SessionData>(() => {
    const profile = getClientProfile();
    return {
      studentId: profile?.studentId || "demo-student-id",
      userId: null,
      role: profile?.role || "student",
      email: profile?.email || null,
      isLoading: false,
      ready: true,
    };
  });

  useEffect(() => {
    let active = true;
    fetch("/api/iscarb/session")
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (active && data) {
            setSession({
              studentId: data.studentId || profileStudentId(),
              userId: data.userId || null,
              role: data.role || "student",
              email: data.email || null,
              isLoading: false,
              ready: true,
            });
          }
        }
      })
      .catch(() => {
        /* Keep client profile fallback */
      });
    return () => {
      active = false;
    };
  }, []);

  return session;
}

function profileStudentId(): string {
  const profile = getClientProfile();
  return profile?.studentId || "demo-student-id";
}
