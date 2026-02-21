import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("next/headers", () => ({
  headers: vi.fn(),
}))

vi.mock("@/server/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}))

import { auth } from "@/server/auth"
import { headers } from "next/headers"
import { getSession } from "./session"

describe("Session helper", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns session when cookie present", async () => {
    // When the auth cookie is present in the request headers, getSession should
    // return the session object (delegating to auth.api.getSession).
    const mockHeaders = new Headers({ cookie: "better-auth.session_token=test-token" })
    vi.mocked(headers).mockResolvedValue(
      mockHeaders as ReturnType<typeof headers> extends Promise<infer T> ? T : never,
    )

    const mockSession = {
      session: {
        id: "session-id",
        userId: "user-id",
        token: "test-token",
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ipAddress: null,
        userAgent: null,
      },
      user: {
        id: "user-id",
        email: "test@example.com",
        name: "Test User",
        emailVerified: true,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as never)

    const result = await getSession()

    expect(result).toEqual(mockSession)
    expect(auth.api.getSession).toHaveBeenCalledWith({ headers: mockHeaders })
  })
})
