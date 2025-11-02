import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/server/db/client';

export const auth = betterAuth({
  // Providers & cookies integration
  secret: process.env.BETTER_AUTH_SECRET ?? '',
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  // Database via Drizzle adapter
  database: drizzleAdapter(db as unknown as Record<string, any>, {
    provider: 'pg',
    usePlural: true,
  }),
});


