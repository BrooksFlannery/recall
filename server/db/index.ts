import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

/**
 * Database connection client.
 *
 * Uses postgres-js driver for both local development and production.
 * For Neon serverless, the connection string format is compatible.
 * The connection string is read from DATABASE_URL environment variable.
 */
const connectionString = process.env["DATABASE_URL"]

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set")
}

// Create postgres client
// Using max: 1 to mirror production serverless behavior (single connection limit)
const client = postgres(connectionString, {
  max: 1,
})

// Create Drizzle instance with schema
export const db = drizzle(client, { schema })

// Export schema for use in migrations and queries
export { schema }
