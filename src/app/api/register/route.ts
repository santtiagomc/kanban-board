// POST /api/register - creates a new user account.
//
// Signing up and signing in are two different problems. This file only does the
// first one: insert a row in the User table. Auth.js is not involved here.

import { hash } from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";

// How much work bcrypt puts into hashing. Each extra round doubles the time.
// 10 is a sane default: slow enough to discourage brute force, fast enough
// that signing up still feels instant.
const BCRYPT_ROUNDS = 10;

export async function POST(request: Request) {
  // 1. Read the body. A malformed JSON payload throws, so it needs its own
  //    guard: without it the request would fail as a 500 (our fault) instead
  //    of a 400 (the caller's fault).
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // 2. Validate. `safeParse` returns a result object instead of throwing,
  //    which keeps the happy path and the error path side by side.
  const result = registerSchema.safeParse(body);

  if (!result.success) {
    return Response.json(
      {
        error: "Invalid data",
        // Field-by-field messages, ready for the form to display later.
        issues: result.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { name, email, password } = result.data;

  // 3. Is the email taken? 409 Conflict is the right status here: the request
  //    is well formed, it just clashes with something that already exists.
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    return Response.json(
      { error: "That email is already registered" },
      { status: 409 },
    );
  }

  // 4. Hash the password. Never store it as plain text: if the database ever
  //    leaks, a hash cannot be turned back into the original password.
  //    bcrypt also adds a random "salt" per user, so two people with the same
  //    password still end up with different hashes.
  const passwordHash = await hash(password, BCRYPT_ROUNDS);

  try {
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      // `select` limits what comes back. The password hash must never leave
      // the server, and the safest way to guarantee that is to not read it.
      select: { id: true, email: true, name: true },
    });

    return Response.json(user, { status: 201 });
  } catch (error) {
    // The check in step 3 is not airtight: two requests with the same email can
    // both pass it before either one writes. The database unique constraint is
    // what actually prevents the duplicate, and it reports it as error P2002.
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return Response.json(
        { error: "That email is already registered" },
        { status: 409 },
      );
    }

    // Anything else is a real bug: log it for us, stay vague for the caller.
    // Internal error details can leak information about the system.
    console.error("POST /api/register failed:", error);

    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
