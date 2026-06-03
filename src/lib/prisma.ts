import { PrismaClient } from "@prisma/client";
import { syncDatabaseEnv, isDemoDataMode } from "@/lib/db-config";

syncDatabaseEnv();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

/** Recreate client after `prisma generate` / schema changes (avoids stale global in dev). */
function prismaClientIsCurrent(client: PrismaClient) {
  return typeof (client as PrismaClient & { phoneOtp?: unknown }).phoneOtp !== "undefined";
}

function getClient() {
  if (isDemoDataMode()) {
    throw new Error("Prisma is unavailable in demo mode (no DATABASE_URL).");
  }
  const cached = globalForPrisma.prisma;
  const client =
    cached && prismaClientIsCurrent(cached) ? cached : createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
});
