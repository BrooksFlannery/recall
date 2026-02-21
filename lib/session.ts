import { auth } from "@/server/auth"
import { headers } from "next/headers"

/**
 * Server-side session helper for use in Server Components and Server Actions.
 * Reads the current session from the incoming request headers/cookies.
 */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}
