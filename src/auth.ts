// Auth.js configuration: everything about signing in and about sessions.
//
// Calling NextAuth() returns four things the rest of the app uses:
//   handlers -> the GET/POST endpoints mounted at /api/auth/*
//   auth     -> reads the current session on the server
//   signIn   -> starts a sign-in attempt
//   signOut  -> clears the session

import { compare } from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Where the session lives. "jwt" means it travels as a signed cookie in the
  // browser instead of a row in the database.
  //
  // This is not a preference: the Credentials provider ONLY works with "jwt".
  // Auth.js persists sessions in the database through an "adapter", and the
  // adapter is built around OAuth providers, not email/password.
  session: { strategy: "jwt" },

  // Our own sign-in page instead of the default one Auth.js ships.
  // Built in step 3c; until then this route 404s, which is expected.
  pages: { signIn: "/login" },

  providers: [
    Credentials({
      // Describes the expected fields. We render our own form, so the labels
      // are irrelevant here; only the field names matter.
      credentials: {
        email: {},
        password: {},
      },

      // The heart of signing in. Returning a user means "credentials accepted";
      // returning null means "rejected". It runs on the server only.
      async authorize(credentials) {
        // Never trust this input: it arrives straight from the network and
        // Auth.js does not validate it for us.
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
          return null;
        }

        // bcrypt re-hashes the typed password using the salt stored inside the
        // saved hash, then compares the two. The original password is never
        // recovered, which is the whole point.
        const passwordMatches = await compare(password, user.passwordHash);

        if (!passwordMatches) {
          return null;
        }

        // Only what belongs in the session. The hash must never end up in a
        // cookie the browser can read.
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],

  callbacks: {
    // Runs whenever the token is created or refreshed. `user` is only present
    // right after a successful sign-in, so that's the moment to copy the id in.
    // Without this, the id would be lost on the next request.
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }

      return token;
    },

    // Runs whenever the session is read. Moves the id from the token to the
    // session object, so `session.user.id` is available across the app.
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }

      return session;
    },
  },
});
