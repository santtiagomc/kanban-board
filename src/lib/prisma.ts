// Prisma client: the single place in the project where the database
// connection is created. The rest of the code imports `prisma` from here.

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  // Failing early with a clear message beats a cryptic connection error later.
  if (!connectionString) {
    throw new Error(
      "Missing DATABASE_URL. Copy .env.example to .env and fill it in.",
    );
  }

  // Prisma 7 no longer ships its own connection engine: it uses `pg`,
  // Node's standard PostgreSQL driver, through this adapter.
  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({ adapter });
}

// ---------------------------------------------------------------------------
// Why `globalThis` instead of a plain `new PrismaClient()`:
//
// In development, Next.js reloads modules every time you save a file.
// Creating a new client on each reload would pile up open connections within
// minutes until Postgres starts rejecting them ("too many clients already").
// Storing it on `globalThis` lets it survive reloads so the same one is reused.
//
// Not needed in production, where the module is only loaded once.
// ---------------------------------------------------------------------------
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
