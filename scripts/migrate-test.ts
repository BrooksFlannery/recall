/**
 * Run Drizzle ORM migrations against the test database.
 *
 * Usage: bun run scripts/migrate-test.ts
 * (Expects DATABASE_URL to point at test DB; use with test:setup or load .env.test first.)
 *
 * For local: bun run test:setup loads .env.test and then runs this.
 */

import { config } from "dotenv"
import { resolve } from "node:path"
import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import postgres from "postgres"

// Load .env.test when DATABASE_URL isn't set (test:setup exports it; CI sets it in workflow)
if (!process.env["DATABASE_URL"]) {
  config({ path: resolve(process.cwd(), ".env.test") })
}

const dbUrl = process.env["DATABASE_URL"]
if (!dbUrl) {
  console.error(
    "DATABASE_URL is not set. Run test:setup or ensure .env.test exists and contains DATABASE_URL."
  )
  process.exit(1)
}

const client = postgres(dbUrl, {
  max: 15,
  // biome-ignore lint/style/useNamingConvention: postgres client option
  idle_timeout: 5,
  prepare: false,
})

const db = drizzle(client)

const migrationsFolder = resolve(process.cwd(), "drizzle")

async function main() {
  console.info("Applying migrations to test database...")
  await migrate(db, { migrationsFolder })
  console.info("Migrations applied successfully.")
  process.exit(0)
}

main().catch((err) => {
  console.error("Error applying migrations:", err)
  process.exit(1)
})
