import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import type { RouterClient } from "@orpc/server"
import type { AppRouter } from "@/server/orpc/routers/_app"

const link = new RPCLink({
  url: `${typeof window !== "undefined" ? "" : (process.env["NEXT_PUBLIC_URL"] ?? "http://localhost:3000")}/api/orpc`,
})

export const orpcClient: RouterClient<AppRouter> = createORPCClient(link)
