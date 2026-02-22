import { createTanstackQueryUtils } from "@orpc/tanstack-query"
import { orpcClient } from "./client"

export const orpc = createTanstackQueryUtils(orpcClient)
