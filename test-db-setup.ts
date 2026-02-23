/**
 * DB-backed test setup (Bun test runner).
 *
 * Load with: bun test --preload ./test-db-setup.ts
 * Prerequisite: bun run test:setup (or DATABASE_URL set in CI).
 */

import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import postgres from "postgres"

// Load .env.test only when DATABASE_URL isn't set (e.g. CI sets it in the workflow).
// Local: test:setup writes DATABASE_URL (with ephemeral port) to .env.test.
const envTestPath = resolve(process.cwd(), ".env.test")
if (!process.env["DATABASE_URL"] && existsSync(envTestPath)) {
  const content = readFileSync(envTestPath, "utf-8")
  for (const line of content.split("\n")) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith("#")) {
      const eq = trimmed.indexOf("=")
      if (eq > 0) {
        const key = trimmed.slice(0, eq).trim()
        let value = trimmed.slice(eq + 1).trim()
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1).replace(/\\n/g, "\n")
        }
        process.env[key] = value
      }
    }
  }
}

;(process.env as Record<string, string>)["NODE_ENV"] = "test"

async function verifyDatabase(): Promise<void> {
  const dbUrl = process.env["DATABASE_URL"]
  if (!dbUrl) {
    throw new Error(
      "DATABASE_URL not set. Start the test database with: bun run test:setup"
    )
  }
  const sql = postgres(dbUrl, {
    max: 1,
    // biome-ignore lint/style/useNamingConvention: postgres client option
    idle_timeout: 2,
  })
  try {
    await sql`SELECT 1`
  } catch (error) {
    throw new Error(
      `Cannot connect to test database at ${dbUrl}. Start it with: bun run test:setup\n\nOriginal error: ${error}`
    )
  } finally {
    await sql.end()
  }
}

// Run verification when this file is loaded (before any test file imports server/db)
await verifyDatabase()
