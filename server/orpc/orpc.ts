import { ORPCError, os } from "@orpc/server"
import type { auth } from "@/server/auth"

export type Context = {
  session: Awaited<ReturnType<typeof auth.api.getSession>>
}

const o = os.$context<Context>()

export const publicProcedure = o

export const protectedProcedure = o.use(({ context, next }) => {
  if (!context.session?.user) {
    throw new ORPCError("UNAUTHORIZED")
  }
  return next({ context: { ...context, session: context.session } })
})
