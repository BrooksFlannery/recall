import { RPCHandler } from "@orpc/server/fetch"
import { appRouter } from "@/server/orpc/routers/_app"
import { auth } from "@/server/auth"

const handler = new RPCHandler(appRouter)

async function handleRequest(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  const { response } = await handler.handle(request, {
    prefix: "/api/orpc",
    context: { session },
  })
  return response ?? new Response("Not found", { status: 404 })
}

export const GET = handleRequest
export const POST = handleRequest
