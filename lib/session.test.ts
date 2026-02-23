import { beforeAll, beforeEach, describe, expect, it, mock } from "bun:test"

const headersMock = mock((): unknown => undefined)
const getSessionMock = mock((): unknown => undefined)
mock.module("next/headers", () => ({ headers: headersMock }))
mock.module("@/server/auth", () => ({ auth: { api: { getSession: getSessionMock } } }))

let getSession: () => Promise<unknown>
beforeAll(async () => {
  // Mocks must be registered before the module under test is loaded
  const mod = await import("./session")
  getSession = mod.getSession
})

describe("Session helper", () => {
  beforeEach(() => {
    mock.clearAllMocks()
  })

  it("returns session when cookie present", async () => {
    const mockHeaders = new Headers({ cookie: "better-auth.session_token=test-token" })
    headersMock.mockResolvedValue(mockHeaders as Awaited<ReturnType<typeof headersMock>>)

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
    getSessionMock.mockResolvedValue(mockSession as never)

    const result = await getSession()

    expect(result).toEqual(mockSession)
    expect(getSessionMock).toHaveBeenCalledWith({ headers: mockHeaders })
  })
})
