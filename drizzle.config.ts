import { defineConfig } from "drizzle-kit"

const databaseUrl = process.env["DATABASE_URL"]
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required. Run 'bun run db:setup' first.")
}

export default defineConfig({
  schema: "./server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
})
