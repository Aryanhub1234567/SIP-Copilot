import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // Lets client generation work before a developer configures a local database.
  // Commands that connect to PostgreSQL still require a real DATABASE_URL.
  datasource: { url: process.env.DATABASE_URL ?? "postgresql://local:local@127.0.0.1:5432/sip_compass" },
});
