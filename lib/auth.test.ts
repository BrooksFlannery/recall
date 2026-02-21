import { describe, expect, it, vi } from "vitest"
import { auth } from "@/server/auth"

// vi.mock is hoisted above imports by vitest — the mock is in place
// before @/server/auth imports @/server/db, preventing any DB connection.
vi.mock("@/server/db", () => ({
  db: {},
  schema: {},
}))

describe("Auth config", () => {
  it("loads without throw", () => {
    // If this module loaded successfully, betterAuth() initialized without error.
    // Verify the auth export is a non-null object.
    expect(typeof auth).toBe("object")
  })
})
