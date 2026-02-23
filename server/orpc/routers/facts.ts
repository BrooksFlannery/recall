import { z } from "zod"
import { protectedProcedure } from "../orpc"

export const FactItemSchema = z.object({
  id: z.string(),
  question: z.string(),
  canonicalAnswer: z.string(),
  createdAt: z.date(),
})

export const FactWithLatestItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userContent: z.string(),
  type: z.enum(["generic"]),
  srsLevel: z.number().int(),
  nextScheduledAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
  latestFactItem: FactItemSchema.nullable(),
})

export type FactItem = z.infer<typeof FactItemSchema>
export type FactWithLatestItem = z.infer<typeof FactWithLatestItemSchema>

export const factsRouter = {
  list: protectedProcedure
    .output(z.array(FactWithLatestItemSchema))
    .handler(() => []),

  create: protectedProcedure
    .input(
      z.object({
        userContent: z.string().min(1),
      }),
    )
    .output(FactWithLatestItemSchema)
    .handler(() => {
      throw new Error("not implemented")
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        userContent: z.string().min(1),
        keepSchedule: z.boolean(),
      }),
    )
    .output(FactWithLatestItemSchema)
    .handler(() => {
      throw new Error("not implemented")
    }),

  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .output(z.object({ success: z.literal(true) }))
    .handler(() => {
      throw new Error("not implemented")
    }),
}
