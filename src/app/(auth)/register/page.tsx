import Link from "next/link";

import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata = {
  title: "Create account | Kanban",
};

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold text-slate-900">Create account</h1>
      <p className="mt-1 mb-6 text-sm text-slate-500">
        Start organizing your work in minutes.
      </p>

      <RegisterForm />

      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-slate-900 underline underline-offset-2"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
