// Shared header for the private pages. A Server Component: it reads the
// session itself, so no page has to pass the email down as a prop.

import Link from "next/link";

import { auth } from "@/auth";
import { SignOutButton } from "@/components/auth/SignOutButton";

export async function AppHeader() {
  const session = await auth();

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
      <Link href="/boards" className="text-lg font-semibold text-slate-900">
        Kanban
      </Link>

      <div className="flex items-center gap-4">
        <span className="hidden text-sm text-slate-600 sm:inline">
          {session?.user?.email}
        </span>
        <SignOutButton />
      </div>
    </header>
  );
}
