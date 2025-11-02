import { describe, it, expect } from 'vitest';
import { createTRPCContext } from '@/server/api/trpc';

describe('tRPC auth context', () => {
  it('exposes null session when no auth headers provided', async () => {
    const req = new Request('http://localhost/api/trpc');
    const ctx = await createTRPCContext({ req });
    // @ts-ignore
    expect(ctx.session).toBeNull();
  });
});


