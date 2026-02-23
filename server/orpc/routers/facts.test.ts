import { describe, it, expect, vi, beforeEach } from "vitest"
import { createRouterClient } from "@orpc/server"
import { MockAIServiceLayer } from "@/lib/ai/ai.service.mock"

vi.mock("@/server/db", () => ({
  db: {
    select: vi.fn(),
    delete: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock("@/lib/ai/openai-ai.service", () => ({
  // biome-ignore lint/style/useNamingConvention: must match the PascalCase export name
  OpenAIAIServiceLayer: MockAIServiceLayer,
}))

import { db } from "@/server/db"
import { factsRouter } from "./facts"

const mockSession = {
  session: {
    id: "s1",
    userId: "user-1",
    token: "tok",
    expiresAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ipAddress: null,
    userAgent: null,
  },
  user: {
    id: "user-1",
    email: "test@example.com",
    name: "Test User",
    emailVerified: true,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
}

const client = createRouterClient(factsRouter, {
  context: { session: mockSession as never },
})

describe("facts.list", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns facts for user newest first", async () => {
    const now = new Date()
    const older = new Date(now.getTime() - 60_000)

    const newerFact = {
      id: "f2",
      userId: "user-1",
      userContent: "Newer fact",
      type: "generic" as const,
      srsLevel: 0,
      nextScheduledAt: now,
      createdAt: now,
      updatedAt: now,
    }
    const olderFact = {
      id: "f1",
      userId: "user-1",
      userContent: "Older fact",
      type: "generic" as const,
      srsLevel: 0,
      nextScheduledAt: older,
      createdAt: older,
      updatedAt: older,
    }
    const newerItem = {
      id: "fi2",
      factId: "f2",
      question: "Q for newer",
      canonicalAnswer: "A for newer",
      createdAt: now,
    }
    const olderItem = {
      id: "fi1",
      factId: "f1",
      question: "Q for older",
      canonicalAnswer: "A for older",
      createdAt: older,
    }

    // First select() call fetches facts; second fetches factItems
    const factsChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([newerFact, olderFact]),
    }
    const itemsChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([newerItem, olderItem]),
    }
    vi.mocked(db.select)
      .mockReturnValueOnce(factsChain as never)
      .mockReturnValueOnce(itemsChain as never)

    const result = await client.list()

    expect(result).toHaveLength(2)
    expect(result[0]?.id).toBe("f2") // newer first
    expect(result[1]?.id).toBe("f1")
    expect(result[0]?.latestFactItem?.id).toBe("fi2")
    expect(result[1]?.latestFactItem?.id).toBe("fi1")
  })
})

describe("facts.delete", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("removes fact for user", async () => {
    const deleteChain = { where: vi.fn().mockResolvedValue(undefined) }
    vi.mocked(db.delete).mockReturnValue(deleteChain as never)

    const result = await client.delete({ id: "f1" })

    expect(result).toEqual({ success: true })
    expect(db.delete).toHaveBeenCalledOnce()
    expect(deleteChain.where).toHaveBeenCalledOnce()
  })
})

describe("facts.create", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("calls AI and stores fact with generic type", async () => {
    const insertChain = { values: vi.fn().mockResolvedValue(undefined) }
    vi.mocked(db.insert).mockReturnValue(insertChain as never)

    const userContent = "The mitochondria is the powerhouse of the cell"
    const result = await client.create({ userContent })

    // AI mock returns deterministic Q/A derived from content
    expect(result.userContent).toBe(userContent)
    expect(result.type).toBe("generic")
    expect(result.latestFactItem?.question).toContain(userContent.slice(0, 50))
    expect(result.latestFactItem?.canonicalAnswer).toContain("The main topic is about")

    // Both facts and fact_items rows were inserted
    expect(db.insert).toHaveBeenCalledTimes(2)
    expect(insertChain.values).toHaveBeenCalledTimes(2)

    // First insert is for facts (check userId and type)
    const [factsInsertCall, factItemsInsertCall] = vi.mocked(insertChain.values).mock.calls
    expect(factsInsertCall?.[0]).toMatchObject({ userId: "user-1", type: "generic", userContent })
    expect(factItemsInsertCall?.[0]).toMatchObject({
      question: result.latestFactItem?.question,
      canonicalAnswer: result.latestFactItem?.canonicalAnswer,
    })
  })
})

describe("facts.update", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("updates content and Q/A; resets SRS when keep_schedule false", async () => {
    const now = new Date()
    const updatedFact = {
      id: "f1",
      userId: "user-1",
      userContent: "Updated content",
      type: "generic" as const,
      srsLevel: 0,
      nextScheduledAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      createdAt: now,
      updatedAt: now,
    }

    const insertChain = { values: vi.fn().mockResolvedValue(undefined) }
    vi.mocked(db.insert).mockReturnValue(insertChain as never)

    const updateChain = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([updatedFact]),
    }
    vi.mocked(db.update).mockReturnValue(updateChain as never)

    const result = await client.update({
      id: "f1",
      userContent: "Updated content",
      keepSchedule: false,
    })

    // New fact_items row inserted with AI-generated Q/A
    expect(db.insert).toHaveBeenCalledOnce()
    expect(insertChain.values).toHaveBeenCalledOnce()

    // Fact updated with new content
    expect(db.update).toHaveBeenCalledOnce()
    const setArg = vi.mocked(updateChain.set).mock.calls[0]?.[0] as Record<string, unknown>

    // keepSchedule false → SRS reset to 0 and nextScheduledAt advanced
    expect(setArg?.["srsLevel"]).toBe(0)
    expect(setArg?.["nextScheduledAt"]).toBeInstanceOf(Date)

    // Returned fact reflects the updated state
    expect(result.id).toBe("f1")
    expect(result.userContent).toBe("Updated content")
    expect(result.latestFactItem?.question).toContain("Updated content".slice(0, 50))
  })
})
