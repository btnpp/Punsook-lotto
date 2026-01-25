import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // ใช้ DIRECT_URL สำหรับ migrations และ db push
    url: process.env.DIRECT_URL || process.env.DATABASE_URL!,
  },
});
