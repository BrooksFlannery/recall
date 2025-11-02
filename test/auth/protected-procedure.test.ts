import { describe, it, expect } from 'vitest';
import { protectedProcedure } from '@/server/api/trpc';

describe('protectedProcedure', () => {
  it('throws when no session', async () => {
    // @ts-ignore minimal call to middleware
    await expect(
      protectedProcedure._def.middlewares[0]({ ctx: { session: null }, next: async () => ({ ctx: {} }) })
    ).rejects.toBeTruthy();
  });
});


