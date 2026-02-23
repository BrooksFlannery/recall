import { z } from "zod"
import { publicProcedure } from "../orpc"
import { factsRouter } from "./facts"

export const appRouter = {
  hello: publicProcedure
    .input(z.object({ name: z.string().optional() }))
    .handler(({ input }) => {
      return { greeting: `Hello ${input.name ?? "world"}!` }
    }),
  facts: factsRouter,
}

export type AppRouter = typeof appRouter
