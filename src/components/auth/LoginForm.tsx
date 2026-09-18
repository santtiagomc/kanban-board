// "use client" marks the boundary: this file and everything it renders runs in
// the browser. It's required here because the form needs useState and onSubmit,
// neither of which exists on the server.
"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  buttonClass,
  formErrorClass,
  inputClass,
  labelClass,
} from "@/components/ui/styles";

export function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    // Without this the browser would reload the page and submit the form the
    // old-fashioned way, throwing away our result handling.
    event.preventDefault();

    setError(null);
    setIsSubmitting(true);

    // `redirect: false` keeps control here instead of letting Auth.js navigate
    // away, so a failed attempt can show an error without losing what was typed.
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      // Deliberately vague: saying "that email doesn't exist" would tell an
      // attacker which addresses are registered.
      setError("Invalid email or password");
      setIsSubmitting(false);
      return;
    }

    // The session cookie now exists, but pages rendered on the server were
    // built before it. refresh() asks the server to re-render them.
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && <p className={formErrorClass}>{error}</p>}

      <div>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isSubmitting}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="password" className={labelClass}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={isSubmitting}
          className={inputClass}
        />
      </div>

      <button type="submit" disabled={isSubmitting} className={buttonClass}>
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
