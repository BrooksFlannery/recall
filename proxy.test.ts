import { beforeAll, beforeEach, describe, expect, it, mock } from "bun:test"
import { NextRequest } from "next/server"

const getSessionMock = mock((): unknown => undefined)
mock.module("@/server/auth", () => ({ auth: { api: { getSession: getSessionMock } } }))

let proxy: (req: NextRequest) => Promise<Response>
beforeAll(async () => {
  // Mocks must be registered before the module under test is loaded
  const mod = await import("./proxy")
  proxy = mod.proxy
})

describe("Proxy", () => {
  beforeEach(() => {
    mock.clearAllMocks()
  })

  it("redirects unauthenticated to sign-in", async () => {
    getSessionMock.mockResolvedValue(null)

    const request = new NextRequest("http://localhost:3000/app/dashboard")
    const response = await proxy(request)

    expect(response.status).toBe(307)
    expect(response.headers.get("location")).toBe("http://localhost:3000/sign-in")
  })

  it("allows authenticated users through protected routes", async () => {
    getSessionMock.mockResolvedValue({
      session: { id: "s1", userId: "u1", token: "tok", expiresAt: new Date(), createdAt: new Date(), updatedAt: new Date(), ipAddress: null, userAgent: null },
      user: { id: "u1", email: "test@example.com", name: "Test", emailVerified: true, image: null, createdAt: new Date(), updatedAt: new Date() },
    } as never)

    const request = new NextRequest("http://localhost:3000/app/dashboard")
    const response = await proxy(request)

    expect(response.status).toBe(200)
  })

  it("allows public paths without authentication", async () => {
    const request = new NextRequest("http://localhost:3000/sign-in")
    const response = await proxy(request)

    expect(response.status).toBe(200)
    expect(getSessionMock).not.toHaveBeenCalled()
  })

  it("allows the landing page without authentication", async () => {
    const request = new NextRequest("http://localhost:3000/")
    const response = await proxy(request)

    expect(response.status).toBe(200)
    expect(getSessionMock).not.toHaveBeenCalled()
  })

  it("allows Better Auth API routes without authentication", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/callback/google")
    const response = await proxy(request)

    expect(response.status).toBe(200)
    expect(getSessionMock).not.toHaveBeenCalled()
  })
})
