"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  buttonClass,
  fieldErrorClass,
  formErrorClass,
  inputClass,
  labelClass,
} from "@/components/ui/styles";
import { registerSchema } from "@/lib/validations";

// One optional message per field, e.g. { email: "Please enter a valid email" }
type FieldErrors = Partial<Record<"name" | "email" | "password", string>>;

export function RegisterForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setFieldErrors({});

    // Same schema the API route uses. Running it here too is purely for speed:
    // the user sees the mistake without waiting for a round trip. It is NOT a
    // security measure, because anyone can call the API directly.
    const parsed = registerSchema.safeParse({
      name: name || undefined,
      email,
      password,
    });

    if (!parsed.success) {
      const issues = parsed.error.flatten().fieldErrors;

      setFieldErrors({
        name: issues.name?.[0],
        email: issues.email?.[0],
        password: issues.password?.[0],
      });

      return;
    }

    setIsSubmitting(true);

    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);

      setError(data?.error ?? "Something went wrong. Please try again.");
      setIsSubmitting(false);
      return;
    }

    // The account exists now, but creating it did not sign anyone in: those are
    // two separate operations. Doing it here saves the user typing it twice.
    const result = await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });

    if (result?.error) {
      // Rare: the account was created but signing in failed. Send them to the
      // sign-in page rather than leaving them stuck on a form that "worked".
      router.push("/login");
      return;
    }

    router.push("/boards");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && <p className={formErrorClass}>{error}</p>}

      <div>
        <label htmlFor="name" className={labelClass}>
          Name <span className="text-slate-400">(optional)</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={isSubmitting}
          className={inputClass}
        />
        {fieldErrors.name && (
          <p className={fieldErrorClass}>{fieldErrors.name}</p>
        )}
      </div>

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
        {fieldErrors.email && (
          <p className={fieldErrorClass}>{fieldErrors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className={labelClass}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={isSubmitting}
          className={inputClass}
        />
        {fieldErrors.password ? (
          <p className={fieldErrorClass}>{fieldErrors.password}</p>
        ) : (
          <p className="mt-1 text-sm text-slate-500">At least 8 characters</p>
        )}
      </div>

      <button type="submit" disabled={isSubmitting} className={buttonClass}>
        {isSubmitting ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
