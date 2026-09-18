// Validation rules, written once with Zod and reused on both sides:
// the browser form (instant feedback) and the API route (the real check).
//
// Client-side validation is a convenience, never a guarantee: anyone can send
// a request straight to the API, so the server must validate again.

import { z } from "zod";

export const registerSchema = z.object({
  // Optional display name. `.trim()` removes surrounding whitespace so a name
  // made only of spaces ends up empty instead of looking valid.
  name: z
    .string()
    .trim()
    .max(60, "Name must be 60 characters or fewer")
    .optional(),

  // Read it as a pipeline: clean the input first, then validate it.
  // Lowercasing matters because "Ana@mail.com" and "ana@mail.com" are the same
  // inbox, and the database unique constraint compares them as different text.
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Please enter a valid email address")),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    // bcrypt only looks at the first 72 bytes of a password; anything beyond
    // that is silently ignored, so we reject it instead of pretending.
    .max(72, "Password must be 72 characters or fewer"),
});

// Infers the TypeScript type from the schema above, so the rules and the types
// can never drift apart: { name?: string; email: string; password: string }
export type RegisterInput = z.infer<typeof registerSchema>;

// Sign-in is deliberately looser than sign-up: the rules that apply here are
// whatever they were when the account was created. Checking "at least 8
// characters" on login would only leak that the stored password is longer.
// The real check is comparing against the stored hash.
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Invalid credentials")),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;
