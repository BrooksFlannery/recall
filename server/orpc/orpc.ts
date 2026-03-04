import { ORPCError, os } from "@orpc/server"
import type { Effect } from "effect"
import type { AIService } from "@/lib/ai/types"
import type { auth } from "@/server/auth"

export type Context = {
  session: Awaited<ReturnType<typeof auth.api.getSession>>
  /** Runs an Effect with the app's AIService Layer (production: OpenAI; tests: mock). */
  runWithAI: <A, E>(eff: Effect.Effect<A, E, AIService>) => Promise<A>
}

const o = os.$context<Context>()

export const publicProcedure = o

export const protectedProcedure = o.use(({ context, next }) => {
  if (!context.session?.user) {
    throw new ORPCError("UNAUTHORIZED")
  }
  return next({ context: { ...context, session: context.session } })
})
