import { PrismaClient } from "@/generated/prisma";
import type { Prisma } from "@/generated/prisma";

const globalForPrisma = globalThis as typeof globalThis & { prisma?: PrismaClient };

const env = process.env.NODE_ENV;
const prismaLog: Prisma.PrismaClientOptions["log"] = (() => {
  if (env === "development") return ["query", "info", "warn", "error"] as const;
  if (env === "test") return [{ level: "warn", emit: "event" }]; // suppress stdout in tests
  return ["warn", "error"] as const;
})();

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ log: prismaLog });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
