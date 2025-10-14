/**
 * Utility helpers for integration tests that need an isolated SQLite database or predictable
 * auth configuration. These helpers copy the repo's dev database into a temporary directory,
 * point Prisma at that clone via environment variables, and offer cleanup so suites stay hermetic.
 */
import { randomUUID } from "node:crypto";
import { copyFileSync, mkdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";

export type SqliteTestDatabase = {
  filePath: string;
  databaseUrl: string;
  cleanup: () => void;
};

const TMP_DIR = join(process.cwd(), "tests", ".tmp");

/**
 * Copy the seed SQLite database into a unique temporary file and point DATABASE_URL (or another
 * env var) at it. Tests should call resetPrismaClientSingleton before importing @/lib/prisma so
 * the PrismaClient instance is created against this clone.
 */
export function cloneSqliteDatabase(options?: { sourcePath?: string; envVar?: string; prefix?: string }): SqliteTestDatabase {
  // Copy the seed database into a unique file so each test run has an isolated schema + data snapshot.
  const envVar = options?.envVar ?? "DATABASE_URL";
  mkdirSync(TMP_DIR, { recursive: true });

  const filePath = join(TMP_DIR, `${options?.prefix ?? "sqlite"}-${randomUUID()}.db`);
  const sourcePath = options?.sourcePath ?? join(process.cwd(), "prisma", "dev.db");

  copyFileSync(sourcePath, filePath);

  const databaseUrl = `file:${filePath}`;
  process.env[envVar] = databaseUrl;

  return {
    filePath,
    databaseUrl,
    cleanup: () => {
      try {
        unlinkSync(filePath);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
          console.warn(`Failed to remove test database at ${filePath}`, error);
        }
      }
    },
  };
}

/**
 * Remove the cached Prisma client from the global scope. The next import of @/lib/prisma will
 * instantiate a fresh PrismaClient that reads process.env.DATABASE_URL, ensuring it targets the
 * cloned database created by cloneSqliteDatabase.
 */
export function resetPrismaClientSingleton() {
  // Drop the cached Prisma client so the next import binds to the freshly cloned database.
  const globalForPrisma = globalThis as typeof globalThis & { prisma?: unknown };
  delete globalForPrisma.prisma;
}

/**
 * Ensure tests always have a JWT secret configured without relying on developer machines. The
 * returned secret is used to patch appConfig so signing/verifying tokens succeeds.
 */
export function ensureTestJwtSecret(secret = "integration-test-secret") {
  // Provide a deterministic JWT secret for tests when the env var is unset.
  if (!process.env.JWT_ACCESS_SECRET) {
    process.env.JWT_ACCESS_SECRET = secret;
  }
  return process.env.JWT_ACCESS_SECRET;
}
