import { z } from "zod"
import { publicProcedure } from "../orpc"

export const appRouter = {
  hello: publicProcedure
    .input(z.object({ name: z.string().optional() }))
    .handler(({ input }) => {
      return { greeting: `Hello ${input.name ?? "world"}!` }
    }),
}

export type AppRouter = typeof appRouter
