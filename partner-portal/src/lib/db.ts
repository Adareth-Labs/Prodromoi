// src/lib/db.ts
import { randomBytes } from 'crypto';
import { PrismaClient } from '@prisma/client';

/**
 * Global Prisma client singleton.
 * In Next.js development, hot reloading can create multiple instances —
 * this pattern prevents exhausting the connection pool.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;

// ─── Query helpers ────────────────────────────────────────────

/**
 * Generate a human-readable reference ID, e.g. "RFQ-2024-9F3A21", "CAR-2024-9F3A".
 *
 * This used to be `prefix + year + (row count + 1)`, which races under
 * concurrent requests (two inserts read the same count) and would collide
 * with the API's random ids now that both apps write the same tables. It now
 * matches the API's format: a random token instead of a sequence number.
 */
export function generateRefId(prefix: string): string {
  const year  = new Date().getFullYear();
  const token = randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${year}-${token}`;
}
