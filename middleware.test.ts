import { describe, expect, it, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@/server/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}))

import { auth } from "@/server/auth"
import { middleware } from "./middleware"

describe("Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("redirects unauthenticated to sign-in", async () => {
    // When no session is present, protected routes should redirect to /sign-in
    vi.mocked(auth.api.getSession).mockResolvedValue(null)

    const request = new NextRequest("http://localhost:3000/app/dashboard")
    const response = await middleware(request)

    expect(response.status).toBe(307)
    expect(response.headers.get("location")).toBe("http://localhost:3000/sign-in")
  })

  it("allows authenticated users through protected routes", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      session: { id: "s1", userId: "u1", token: "tok", expiresAt: new Date(), createdAt: new Date(), updatedAt: new Date(), ipAddress: null, userAgent: null },
      user: { id: "u1", email: "test@example.com", name: "Test", emailVerified: true, image: null, createdAt: new Date(), updatedAt: new Date() },
    } as never)

    const request = new NextRequest("http://localhost:3000/app/dashboard")
    const response = await middleware(request)

    expect(response.status).toBe(200)
  })

  it("allows public paths without authentication", async () => {
    const request = new NextRequest("http://localhost:3000/sign-in")
    const response = await middleware(request)

    expect(response.status).toBe(200)
    expect(auth.api.getSession).not.toHaveBeenCalled()
  })

  it("allows the landing page without authentication", async () => {
    const request = new NextRequest("http://localhost:3000/")
    const response = await middleware(request)

    expect(response.status).toBe(200)
    expect(auth.api.getSession).not.toHaveBeenCalled()
  })

  it("allows Better Auth API routes without authentication", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/callback/google")
    const response = await middleware(request)

    expect(response.status).toBe(200)
    expect(auth.api.getSession).not.toHaveBeenCalled()
  })
})
