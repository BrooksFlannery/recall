import { Effect } from 'effect'
import type { z } from 'zod'

/**
 * Bridge between Zod validation and Effect error handling.
 * Wraps Zod's safeParse in Effect.succeed/Effect.fail.
 *
 * @param schema - Zod schema to validate against
 * @param value - Value to validate
 * @returns Effect that succeeds with parsed value or fails with ZodError
 */
export function parseZodToEffect<T>(
  schema: z.ZodSchema<T>,
  value: unknown
): Effect.Effect<T, z.ZodError> {
  const result = schema.safeParse(value)

  if (result.success) {
    return Effect.succeed(result.data)
  }

  return Effect.fail(result.error)
}
