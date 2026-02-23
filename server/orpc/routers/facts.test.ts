import { describe, it, expect, vi, beforeEach } from "vitest"
import { createRouterClient } from "@orpc/server"

vi.mock("@/server/db", () => ({
  db: {
    select: vi.fn(),
    delete: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
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
  it.skip("calls AI and stores fact with generic type", async () => {
    // Setup: mock the AI service so generateQuestionAnswer returns a
    // deterministic question and canonicalAnswer; provide an authenticated
    // user session in the oRPC context
    //
    // Expectation: create calls the AI service with the supplied userContent;
    // a facts row is inserted with type "generic" and the correct userId;
    // a linked fact_items row is inserted containing the AI-generated
    // question and canonicalAnswer; the returned FactWithLatestItem reflects
    // both the new fact and its fact_item
  })
})

describe("facts.update", () => {
  it.skip("updates content and Q/A; resets SRS when keep_schedule false", async () => {
    // Setup: seed an existing fact with srsLevel > 0 and a fact_items row;
    // mock the AI service to return new question and canonicalAnswer for the
    // updated userContent
    //
    // Expectation: update changes the fact's userContent; inserts a new
    // fact_items row with the fresh AI-generated Q/A (preserving history);
    // when keepSchedule is false, srsLevel is reset to 0 and nextScheduledAt
    // is set to approximately now + 1 day
  })
})
