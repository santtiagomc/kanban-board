// Shown for any unknown URL, and whenever a page calls notFound() - which is
// what happens when a board doesn't exist OR belongs to someone else.
//
// The wording is deliberately vague about which of the two it is. Saying
// "this board belongs to another user" would confirm that the id is real.

import Link from "next/link";

import { buttonClass } from "@/components/ui/styles";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
      <p className="text-5xl font-semibold text-slate-300">404</p>

      <h1 className="text-2xl font-semibold text-slate-900">Page not found</h1>

      <p className="max-w-md text-slate-600">
        This page doesn&apos;t exist, or you don&apos;t have access to it.
      </p>

      <Link href="/boards" className={`${buttonClass} mt-2 w-auto`}>
        Back to boards
      </Link>
    </main>
  );
}
