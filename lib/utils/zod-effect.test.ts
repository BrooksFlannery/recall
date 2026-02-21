import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { Effect } from 'effect'
import { parseZodToEffect } from './zod-effect'

describe.skip('Zod–Effect bridge', () => {
  it('parseZodToEffect succeeds on valid input', async () => {
    const schema = z.object({ name: z.string() })
    const input = { name: 'Alice' }

    const result = await Effect.runPromise(parseZodToEffect(schema, input))

    expect(result).toEqual({ name: 'Alice' })
  })

  it('parseZodToEffect fails on invalid input (typed ZodError)', async () => {
    const schema = z.object({ name: z.string() })
    const input = { name: 123 }

    const effect = parseZodToEffect(schema, input)

    await expect(Effect.runPromise(effect)).rejects.toThrow()
  })
})
