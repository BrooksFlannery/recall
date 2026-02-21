import { Layer, ManagedRuntime } from "effect"
import { OpenAIAIServiceLayer } from "@/lib/ai/openai-ai.service"

/**
 * Shared server-side Effect runtime.
 * Provides AIService (OpenAI implementation) to any Effect program
 * run via AppRuntime.runPromise / AppRuntime.runSync.
 */
const AppLayer = Layer.mergeAll(OpenAIAIServiceLayer)

export const AppRuntime = ManagedRuntime.make(AppLayer)
