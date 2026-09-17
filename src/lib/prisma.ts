// Cliente de Prisma: el único punto del proyecto donde se abre la conexión
// a la base de datos. Todo el resto del código importa `prisma` desde acá.

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  // Fallar temprano y con un mensaje claro es mucho mejor que un error críptico
  // de conexión más adelante.
  if (!connectionString) {
    throw new Error(
      "Falta la variable DATABASE_URL. Copiá .env.example a .env y completala.",
    );
  }

  // Prisma 7 ya no trae su propio motor de conexión: usa el driver `pg`,
  // el estándar de Node para PostgreSQL, a través de este adaptador.
  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({ adapter });
}

// ---------------------------------------------------------------------------
// Por qué este "globalThis" en vez de un simple `new PrismaClient()`:
//
// En desarrollo, Next.js recarga los módulos cada vez que guardás un archivo.
// Si creáramos un cliente nuevo en cada recarga, en pocos minutos tendrías
// decenas de conexiones abiertas y Postgres terminaría rechazándolas
// ("too many clients already"). Guardarlo en `globalThis` hace que sobreviva
// a las recargas y siempre se reutilice el mismo.
//
// En producción no hace falta porque el módulo se carga una sola vez.
// ---------------------------------------------------------------------------
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
