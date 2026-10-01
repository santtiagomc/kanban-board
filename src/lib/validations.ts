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

// Used for both creating and renaming a board: the only editable field is the
// title, and the rules are the same either way.
export const boardSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(100, "Title must be 100 characters or fewer"),
});

export type BoardInput = z.infer<typeof boardSchema>;

// Used for creating and renaming a column. Shorter than a board title because
// column headers are narrow on screen.
export const columnSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(50, "Title must be 50 characters or fewer"),
});

export type ColumnInput = z.infer<typeof columnSchema>;

// Reordering sends the complete list of column ids in their new order.
// Sending the whole list (instead of "move X to position 2") means the server
// never has to guess what the other columns should look like.
export const reorderColumnsSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1, "orderedIds cannot be empty"),
});

export type ReorderColumnsInput = z.infer<typeof reorderColumnsSchema>;

// Used for creating and editing a card.
export const cardSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or fewer"),

  // .nullish() means "optional, and null is allowed". The difference matters:
  //   undefined (field absent) -> "don't change this"
  //   null                     -> "clear this field"
  description: z
    .string()
    .trim()
    .max(2000, "Description must be 2000 characters or fewer")
    .nullish(),

  // z.coerce.date() turns the string the browser sends ("2026-12-25") into a
  // real Date. Anything unparseable is rejected, and null passes through
  // untouched - worth knowing, because new Date(null) in plain JavaScript
  // silently returns 1 January 1970 instead of failing.
  dueDate: z.coerce.date().nullish(),
});

export type CardInput = z.infer<typeof cardSchema>;

// Same idea as reordering columns, with one extra power: an id may belong to
// a different column of the same board, in which case the card is MOVED here.
// That makes one endpoint cover both "reorder inside a column" and "drag to
// another column".
export const reorderCardsSchema = z.object({
  orderedIds: z.array(z.string().min(1)),
});

export type ReorderCardsInput = z.infer<typeof reorderCardsSchema>;
