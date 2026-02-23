import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import { describe, expect, it } from "bun:test"
import { db } from "@/server/db"
import { factItems, facts, user } from "@/server/db/schema"
import { appRouter } from "./_app"

/**
 * Facts procedures tested against a real Postgres database.
 * No DB mocking. Run with: bun run test:db (after bun run test:setup).
 */

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
      context: {
        session: {
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
        },
      },
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
      context: {
        session: {
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
        },
      },
    })
    const result = await del({ id: factId })

    expect(result).toEqual({ success: true })

    const remainingFacts = await db.select().from(facts).where(eq(facts.id, factId))
    expect(remainingFacts).toHaveLength(0)
    const remainingItems = await db.select().from(factItems).where(eq(factItems.factId, factId))
    expect(remainingItems).toHaveLength(0)
  })
})
