"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      // signOut clears the session cookie and then navigates. `redirectTo`
      // decides where the user lands afterwards.
      onClick={() => signOut({ redirectTo: "/login" })}
      className="text-sm font-medium text-slate-600 underline underline-offset-2 hover:text-slate-900"
    >
      Sign out
    </button>
  );
}
