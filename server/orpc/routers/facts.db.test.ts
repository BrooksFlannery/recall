import { eq } from "drizzle-orm"
import { ManagedRuntime } from "effect"
import { nanoid } from "nanoid"
import { describe, expect, it } from "bun:test"
import { MockAIServiceLayer } from "@/lib/ai/ai.service.mock"
import { db } from "@/server/db"
import { factItems, facts, user } from "@/server/db/schema"
import { appRouter } from "./_app"

/**
 * Facts procedures tested against a real Postgres database.
 * No DB mocking. Run with: bun run test:db (after bun run test:setup).
 */

const testRuntime = ManagedRuntime.make(MockAIServiceLayer)

function makeTestUser() {
  const id = nanoid()
  const now = new Date()
  return {
    id,
    name: "Test User",
    email: `test-${id}@example.com`,
    emailVerified: true,
    image: null,
    createdAt: now,
    updatedAt: now,
  }
}

function makeContext(sessionData: {
  session: object
  user: ReturnType<typeof makeTestUser>
}) {
  return {
    session: sessionData,
    runWithAI: (eff: Parameters<typeof testRuntime.runPromise>[0]) =>
      testRuntime.runPromise(eff),
  }
}

describe("facts.list", () => {
  it("returns facts for user newest first with latest fact_item", async () => {
    const testUser = makeTestUser()
    await db.insert(user).values(testUser)

    const olderId = nanoid()
    const newerId = nanoid()
    const now = new Date()
    const olderCreated = new Date(now.getTime() - 10_000)
    const newerCreated = new Date(now.getTime() - 5000)

    await db.insert(facts).values([
      {
        id: olderId,
        userId: testUser.id,
        userContent: "Older fact",
        type: "generic",
        srsLevel: 0,
        nextScheduledAt: now,
        createdAt: olderCreated,
        updatedAt: olderCreated,
      },
      {
        id: newerId,
        userId: testUser.id,
        userContent: "Newer fact",
        type: "generic",
        srsLevel: 0,
        nextScheduledAt: now,
        createdAt: newerCreated,
        updatedAt: newerCreated,
      },
    ])

    const itemOlder = nanoid()
    const itemNewer = nanoid()
    await db.insert(factItems).values([
      {
        id: itemOlder,
        factId: olderId,
        question: "Q older",
        canonicalAnswer: "A older",
        createdAt: olderCreated,
      },
      {
        id: itemNewer,
        factId: newerId,
        question: "Q newer",
        canonicalAnswer: "A newer",
        createdAt: newerCreated,
      },
    ])

    const list = appRouter.facts.list.callable({
      context: makeContext({
        session: {
          id: "s1",
          userId: testUser.id,
          token: "t",
          expiresAt: now,
          createdAt: now,
          updatedAt: now,
          ipAddress: null,
          userAgent: null,
        },
        user: testUser,
      }),
    })
    const result = await list({})

    expect(result).toHaveLength(2)
    const first = result[0]
    const second = result[1]
    if (!first || !second) {
      throw new Error("expected two results")
    }
    expect(first.id).toBe(newerId)
    expect(first.userContent).toBe("Newer fact")
    expect(first.latestFactItem).toMatchObject({ question: "Q newer" })
    expect(second.id).toBe(olderId)
    expect(second.userContent).toBe("Older fact")
    expect(second.latestFactItem?.question).toBe("Q older")
  })
})

describe("facts.delete", () => {
  it("removes fact for user and cascades to fact_items", async () => {
    const testUser = makeTestUser()
    await db.insert(user).values(testUser)

    const factId = nanoid()
    const itemId = nanoid()
    const now = new Date()
    await db.insert(facts).values({
      id: factId,
      userId: testUser.id,
      userContent: "To delete",
      type: "generic",
      srsLevel: 0,
      nextScheduledAt: now,
      createdAt: now,
      updatedAt: now,
    })
    await db.insert(factItems).values({
      id: itemId,
      factId,
      question: "Q",
      canonicalAnswer: "A",
      createdAt: now,
    })

    const del = appRouter.facts.delete.callable({
      context: makeContext({
        session: {
          id: "s2",
          userId: testUser.id,
          token: "t",
          expiresAt: now,
          createdAt: now,
          updatedAt: now,
          ipAddress: null,
          userAgent: null,
        },
        user: testUser,
      }),
    })
    const result = await del({ id: factId })

    expect(result).toEqual({ success: true })

    const remainingFacts = await db.select().from(facts).where(eq(facts.id, factId))
    expect(remainingFacts).toHaveLength(0)
    const remainingItems = await db.select().from(factItems).where(eq(factItems.factId, factId))
    expect(remainingItems).toHaveLength(0)
  })
})

describe("facts.create", () => {
  it("calls AI and stores fact with generic type and one fact_item", async () => {
    const testUser = makeTestUser()
    await db.insert(user).values(testUser)
    const now = new Date()

    const create = appRouter.facts.create.callable({
      context: makeContext({
        session: {
          id: "s3",
          userId: testUser.id,
          token: "t",
          expiresAt: now,
          createdAt: now,
          updatedAt: now,
          ipAddress: null,
          userAgent: null,
        },
        user: testUser,
      }),
    })

    const userContent = "The capital of France is Paris."
    const result = await create({ userContent })
    // Mock AI returns deterministic Q/A; assert exact shape (satisfies lint: precise assertions)
    const expectedQuestion = `What is the main topic of: "${userContent}"?`
    const expectedCanonicalAnswer = `The main topic is about ${userContent.slice(0, 30)}${userContent.length > 30 ? "..." : ""}.`

    expect(result.userContent).toBe(userContent)
    expect(result.type).toBe("generic")
    expect(result.latestFactItem?.question).toBe(expectedQuestion)
    expect(result.latestFactItem?.canonicalAnswer).toBe(expectedCanonicalAnswer)

    const factsRows = await db.select().from(facts).where(eq(facts.userId, testUser.id))
    expect(factsRows).toHaveLength(1)
    expect(factsRows[0]?.userContent).toBe(userContent)
    expect(factsRows[0]?.type).toBe("generic")
    expect(factsRows[0]?.srsLevel).toBe(0)

    const itemsRows = await db
      .select()
      .from(factItems)
      .where(eq(factItems.factId, result.id))
    expect(itemsRows).toHaveLength(1)
    expect(itemsRows[0]?.question).toBe(expectedQuestion)
    expect(itemsRows[0]?.canonicalAnswer).toBe(expectedCanonicalAnswer)
  })
})
