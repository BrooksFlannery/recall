import { and, desc, eq, inArray } from "drizzle-orm"
import { Effect } from "effect"
import { nanoid } from "nanoid"
import { z } from "zod"
import { AIService } from "@/lib/ai/types"
import { createTableSchemas } from "@/lib/utils/table-schemas"
import { db } from "@/server/db"
import { factItems, facts } from "@/server/db/schema"
import { protectedProcedure } from "../orpc"

const ONE_DAY_MS = 24 * 60 * 60 * 1000

/**
 * Schemas derived from the `facts` table.
 *
 * - `system`     — DB-generated fields visible to clients but never written.
 * - `serverOnly` — Fields owned by server business logic, hidden from clients.
 * - `createOnly` — `type` is set once on creation and cannot be changed.
 */
const factsSchemas = createTableSchemas(facts, {
  system: ["id", "createdAt", "updatedAt"],
  clientHidden: ["userId", "srsLevel", "nextScheduledAt"],
  createOnly: ["type"],
})

/**
 * Schemas derived from the `fact_items` table.
 *
 * - `system`     — `id` and `createdAt` are DB-generated.
 * - `serverOnly` — `factId` is an internal linking key, not exposed to clients.
 */
const factItemsSchemas = createTableSchemas(factItems, {
  system: ["id", "createdAt"],
  clientHidden: ["factId"],
})

/**
 * The shape returned by `facts.list`, `facts.create`, and `facts.update`.
 * A fact joined with its most recent AI-generated question/answer pair.
 * `latestFactItem` is nullable for safety, though a fact always has at least one item after creation.
 */
export const FactWithLatestItemSchema = factsSchemas.clientSelect.extend({
  latestFactItem: factItemsSchemas.clientSelect.nullable(),
})

export type FactWithLatestItem = z.infer<typeof FactWithLatestItemSchema>

export const factsRouter = {
  /**
   * Returns all facts for the authenticated user, ordered newest first,
   * each joined with its latest `fact_items` row.
   */
  list: protectedProcedure
    .output(z.array(FactWithLatestItemSchema))
    .handler(async ({ context }) => {
      const userId = context.session.user.id
      const factsRows = await db
        .select()
        .from(facts)
        .where(eq(facts.userId, userId))
        .orderBy(desc(facts.createdAt))
      if (factsRows.length === 0) {
        return []
      }
      const factIds = factsRows.map((r) => r.id)
      const itemsRows = await db
        .select()
        .from(factItems)
        .where(inArray(factItems.factId, factIds))
        .orderBy(desc(factItems.createdAt))
      const latestByFactId = new Map<string, (typeof itemsRows)[number]>()
      for (const row of itemsRows) {
        if (!latestByFactId.has(row.factId)) {
          latestByFactId.set(row.factId, row)
        }
      }
      return factsRows.map((f) => {
        const latest = latestByFactId.get(f.id) ?? null
        return {
          id: f.id,
          userContent: f.userContent,
          type: f.type,
          createdAt: f.createdAt,
          updatedAt: f.updatedAt,
          latestFactItem: latest
            ? {
                id: latest.id,
                question: latest.question,
                canonicalAnswer: latest.canonicalAnswer,
                createdAt: latest.createdAt,
              }
            : null,
        }
      }) as FactWithLatestItem[]
    }),

  /**
   * Accepts user-supplied text, calls the AI service to generate a question
   * and canonical answer, then persists the fact and its first `fact_items` row.
   */
  create: protectedProcedure
    .input(factsSchemas.clientCreate)
    .output(FactWithLatestItemSchema)
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id
      const userContent = input["userContent"]
      if (typeof userContent !== "string") {
        throw new Error("userContent is required")
      }
      const qa = await context.runWithAI(
        Effect.gen(function* () {
          const ai = yield* AIService
          return yield* ai.generateQuestionAnswer(userContent)
        }),
      )
      const now = new Date()
      const nextScheduledAt = new Date(now.getTime() + ONE_DAY_MS)
      const factId = nanoid()
      const itemId = nanoid()
      const type = input["type"] ?? "generic"
      await db.insert(facts).values({
        id: factId,
        userId,
        userContent,
        type,
        srsLevel: 0,
        nextScheduledAt,
        createdAt: now,
        updatedAt: now,
      })
      await db.insert(factItems).values({
        id: itemId,
        factId,
        question: qa.question,
        canonicalAnswer: qa.canonicalAnswer,
        createdAt: now,
      })
      return {
        id: factId,
        userContent,
        type,
        createdAt: now,
        updatedAt: now,
        latestFactItem: {
          id: itemId,
          question: qa.question,
          canonicalAnswer: qa.canonicalAnswer,
          createdAt: now,
        },
      } as unknown as FactWithLatestItem
    }),

  /**
   * Re-generates the question/answer for new user content and inserts a new
   * `fact_items` row (preserving history). When `keepSchedule` is false the
   * SRS schedule is reset to level 0 (next review in 1 day).
   */
  update: protectedProcedure
    .input(
      factsSchemas.clientUpdate.extend({
        /** When false, resets the SRS schedule to level 0 (next review in 1 day). */
        keepSchedule: z.boolean(),
      }),
    )
    .output(FactWithLatestItemSchema)
    .handler(() => {
      throw new Error("not implemented")
    }),

  /**
   * Hard-deletes the fact and cascades to all associated `fact_items` rows.
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .output(z.object({ success: z.literal(true) }))
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id
      await db
        .delete(facts)
        .where(and(eq(facts.id, input.id), eq(facts.userId, userId)))
      return { success: true }
    }),
}
