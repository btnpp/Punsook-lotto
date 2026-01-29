import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
  
  if (!connectionString) {
    throw new Error("DATABASE_URL or DIRECT_URL is not set");
  }

  // Reuse pool if exists (important for serverless)
  if (!globalForPrisma.pool) {
    globalForPrisma.pool = new Pool({ 
      connectionString,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
      // Optimized pool settings for serverless
      max: 15,                    // Increased from 5 for better concurrency
      min: 2,                     // Keep minimum connections warm
      idleTimeoutMillis: 30000,   // Close idle connections after 30s
      connectionTimeoutMillis: 10000, // Timeout for acquiring connection
      allowExitOnIdle: true,      // Allow process to exit when pool is idle
    });
  }
  
  const adapter = new PrismaPg(globalForPrisma.pool);
  
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;

