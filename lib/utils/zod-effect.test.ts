import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { Effect, Either } from 'effect'
import { parseZodToEffect } from './zod-effect'

describe('Zod–Effect bridge', () => {
  it('parseZodToEffect succeeds on valid input', async () => {
    const schema = z.object({ name: z.string() })
    const input = { name: 'Alice' }

    const result = await Effect.runPromise(parseZodToEffect(schema, input))

    expect(result).toEqual({ name: 'Alice' })
  })

  it('parseZodToEffect fails on invalid input (typed ZodError)', async () => {
    const schema = z.object({ name: z.string() })
    const input = { name: 123 }

    const either = await Effect.runPromise(
      Effect.either(parseZodToEffect(schema, input))
    )

    expect(Either.isLeft(either)).toBe(true)
    if (Either.isLeft(either)) {
      expect(either.left).toMatchObject({
        name: 'ZodError',
        issues: expect.any(Array),
      })
    }
  })
})
