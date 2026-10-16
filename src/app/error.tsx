// Error boundaries must be Client Components: they catch errors that happen
// while rendering, which is a browser-side concern.
"use client";

import Link from "next/link";
import { useEffect } from "react";

import { buttonClass, secondaryButtonClass } from "@/components/ui/styles";

// Catches unexpected runtime errors in any page below this folder - the
// database being unreachable, a query failing, a bug in a component.
//
// Without this file the user would see Next's raw error screen in
// development, and a blank page in production.
//
// NOTE: in Next 16 the retry function is called `retry`. It was `reset` in
// versions 14 and 15, so older examples wire up a button that does nothing.
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // In a real product this would go to an error tracking service. The
    // console is enough here, and it keeps the cause visible instead of
    // swallowed.
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">
        Something went wrong
      </h1>

      <p className="max-w-md text-slate-600">
        The page could not be loaded. This is usually temporary.
      </p>

      {/* error.digest is an id Next generates for the error. In production the
          message itself is hidden on purpose - it can reveal how the system
          works - but the digest lets you find it in the server logs. */}
      {error.digest && (
        <p className="text-xs text-slate-400">Reference: {error.digest}</p>
      )}

      <div className="mt-2 flex gap-2">
        {/* retry() re-renders the segment that failed, without a full page
            reload: if the cause was temporary, the content simply appears. */}
        <button type="button" onClick={retry} className={`${buttonClass} w-auto`}>
          Try again
        </button>

        <Link href="/boards" className={secondaryButtonClass}>
          Back to boards
        </Link>
      </div>
    </main>
  );
}
