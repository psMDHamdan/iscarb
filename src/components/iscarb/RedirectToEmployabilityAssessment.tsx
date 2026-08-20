"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Course-quiz UI removed — product assessment is the 4D employability modules
 * (SPA view `assessment`). Old quiz URLs land here.
 */
export function RedirectToEmployabilityAssessment() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/assessment");
  }, [router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center p-8">
      <p className="text-sm text-muted-foreground">
        Opening employability assessment…
      </p>
    </div>
  );
}
