import { z } from "zod"
import { protectedProcedure } from "../orpc"
import { createTableSchemas } from "@/lib/utils/table-schemas"
import { facts, factItems } from "@/server/db/schema"
import { db } from "@/server/db"
import { eq, desc, and, inArray } from "drizzle-orm"
import { ORPCError } from "@orpc/server"

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
 * The shape returned by `facts.list`, `facts.create`, and `facts.update`.
 * A fact joined with its most recent AI-generated question/answer pair.
 * `latestFactItem` is nullable for safety, though a fact always has at least one item after creation.
 *
 * Note: defined explicitly rather than composing from `factsSchemas.clientSelect.extend()` and
 * `factItemsSchemas.clientSelect` because the `as any` cast inside `createTableSchemas` prevents
 * Zod 4 from inferring omitted-key shapes correctly; both schemas lose field-level type information.
 * The explicit definition below matches what those schemas would produce at runtime.
 */
export const FactWithLatestItemSchema = z.object({
  id: z.string(),
  userContent: z.string(),
  type: z.enum(["generic"]),
  createdAt: z.date(),
  updatedAt: z.date(),
  latestFactItem: z
    .object({
      id: z.string(),
      question: z.string(),
      canonicalAnswer: z.string(),
      createdAt: z.date(),
    })
    .nullable(),
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

      const userFacts = await db
        .select()
        .from(facts)
        .where(eq(facts.userId, userId))
        .orderBy(desc(facts.createdAt))

      if (userFacts.length === 0) { return [] }

      const factIds = userFacts.map((f) => f.id)
      const allItems = await db
        .select()
        .from(factItems)
        .where(inArray(factItems.factId, factIds))
        .orderBy(desc(factItems.createdAt))

      // Build map of factId → latest item (allItems already sorted newest first)
      const latestByFactId = new Map<string, (typeof allItems)[0]>()
      for (const item of allItems) {
        if (!latestByFactId.has(item.factId)) {
          latestByFactId.set(item.factId, item)
        }
      }

      return userFacts.map((fact) => {
        const latestItem = latestByFactId.get(fact.id) ?? null
        return {
          id: fact.id,
          userContent: fact.userContent,
          type: fact.type,
          createdAt: fact.createdAt,
          updatedAt: fact.updatedAt,
          latestFactItem: latestItem
            ? {
                id: latestItem.id,
                question: latestItem.question,
                canonicalAnswer: latestItem.canonicalAnswer,
                createdAt: latestItem.createdAt,
              }
            : null,
        }
      })
    }),

  /**
   * Accepts user-supplied text, calls the AI service to generate a question
   * and canonical answer, then persists the fact and its first `fact_items` row.
   */
  create: protectedProcedure
    .input(factsSchemas.clientCreate)
    .output(FactWithLatestItemSchema)
    .handler(() => {
      throw new ORPCError("NOT_IMPLEMENTED")
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
      throw new ORPCError("NOT_IMPLEMENTED")
    }),

  /**
   * Hard-deletes the fact and cascades to all associated `fact_items` rows.
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .output(z.object({ success: z.literal(true) }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id
      await db
        .delete(facts)
        .where(and(eq(facts.id, input.id), eq(facts.userId, userId)))
      return { success: true as const }
    }),
}
