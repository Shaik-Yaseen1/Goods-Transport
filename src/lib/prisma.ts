import { PrismaClient } from "@prisma/client";

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

const cached = globalForPrisma.prisma;
export const prisma =
  cached && prismaClientIsCurrent(cached) ? cached : createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
