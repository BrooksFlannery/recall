/**
 * Run Drizzle ORM migrations against the database.
 *
 * Usage: bun run scripts/migrate.ts
 *
 * Reads DATABASE_URL from the environment (pulled from Vercel in CI,
 * or from .env.local during local development).
 *
 * Adjust the migrationsFolder path to match your project layout.
 */

import { readFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"
import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import postgres from "postgres"

// Load .env.local when DATABASE_URL is not set (CI after vercel pull, or local dev)
const envPath = resolve(process.cwd(), ".env.local")
if (!process.env["DATABASE_URL"] && existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const eq = trimmed.indexOf('=')
      if (eq > 0) {
        const key = trimmed.slice(0, eq).trim()
        const value = trimmed.slice(eq + 1).trim()
        if (value.startsWith('"') && value.endsWith('"')) {
          process.env[key] = value.slice(1, -1).replace(/\\n/g, '\n')
        } else {
          process.env[key] = value
        }
      }
    }
  }
}

const dbUrl = process.env["DATABASE_URL"]
if (!dbUrl) {
  console.error(
    'DATABASE_URL is not set.\n\n' +
      'For local dev: add it to .env.local\n' +
      'For CI: ensure `vercel pull` ran first to populate env vars.'
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

async function main() {
  console.info('Applying migrations...')
  await migrate(db, { migrationsFolder: "drizzle" })
  console.info('Migrations applied successfully.')
  process.exit(0)
}

main().catch((err) => {
  console.error('Error applying migrations:', err)
  process.exit(1)
})
