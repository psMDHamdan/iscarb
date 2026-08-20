"use client"
import { ErrorFallback } from "@/components/iscarb/ErrorFallback"
export default function AssessmentError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorFallback error={error} reset={reset} />
}
