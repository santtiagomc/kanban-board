// Server Component: it runs on the server and never ships to the browser.
// It only renders static markup plus <LoginForm />, which IS a Client
// Component. That is the usual shape: a server page with small interactive
// islands inside it.

import Link from "next/link";

import { LoginForm } from "@/components/auth/LoginForm";

// Sets the browser tab title for this page.
export const metadata = {
  title: "Sign in | Kanban",
};

export default function LoginPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold text-slate-900">Sign in</h1>
      <p className="mt-1 mb-6 text-sm text-slate-500">
        Welcome back. Enter your details to continue.
      </p>

      <LoginForm />

      <p className="mt-6 text-center text-sm text-slate-600">
        Don&apos;t have an account?{" "}
        {/* <Link> navigates without a full page reload, unlike a plain <a>. */}
        <Link
          href="/register"
          className="font-medium text-slate-900 underline underline-offset-2"
        >
          Create one
        </Link>
      </p>
    </>
  );
}
