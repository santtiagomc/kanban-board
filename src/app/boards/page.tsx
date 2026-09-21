// The first private page. For now it only proves the session works;
// phase 4 turns it into the real board list.

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { SignOutButton } from "@/components/auth/SignOutButton";

export const metadata = {
  title: "Boards | Kanban",
};

export default async function BoardsPage() {
  // THE real authorization check. proxy.ts only looked at whether a cookie
  // exists; auth() verifies its signature and expiry. Never skip this, even
  // on a route the proxy already guards.
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-slate-900">Boards</h1>

        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600">{session.user.email}</span>
          <SignOutButton />
        </div>
      </header>

      <main className="px-6 py-10">
        <p className="text-slate-600">
          You are signed in. Your boards will show up here.
        </p>
      </main>
    </div>
  );
}
