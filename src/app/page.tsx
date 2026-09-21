// Home page. A Server Component, so it can read the session directly with
// auth() - no fetch, no loading state, no session data exposed to the browser.
// This is the App Router payoff: server code and markup in the same file.

import Link from "next/link";

import { auth } from "@/auth";
import { buttonClass } from "@/components/ui/styles";

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 px-4 text-center">
      <h1 className="text-4xl font-semibold text-slate-900">Kanban</h1>
      <p className="max-w-md text-slate-600">
        Organize your work in boards, columns and cards.
      </p>

      {session?.user ? (
        <div className="flex w-full max-w-xs flex-col gap-3">
          <p className="text-slate-700">
            Signed in as{" "}
            <span className="font-medium">{session.user.email}</span>
          </p>
          <Link href="/boards" className={`${buttonClass} text-center`}>
            Go to my boards
          </Link>
        </div>
      ) : (
        <div className="flex w-full max-w-xs flex-col gap-3">
          <Link href="/login" className={`${buttonClass} text-center`}>
            Sign in
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium text-slate-700 underline underline-offset-2"
          >
            Create an account
          </Link>
        </div>
      )}
    </main>
  );
}
