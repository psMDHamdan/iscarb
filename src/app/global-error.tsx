'use client';

/**
 * Root error boundary — renders instead of the root layout when a top-level
 * error escapes every route/segment boundary.
 * Keep this file minimal.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="m-0 p-0 font-sans antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center p-8">
          <h1 className="mb-2 text-xl font-semibold">Something went wrong</h1>
          <p className="mb-4 text-center text-muted-foreground">Please try again.</p>
          <button
            onClick={() => reset()}
            className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
