# Better Auth: Drizzle Adapter (Summary)

Reference: https://www.better-auth.com/docs/adapters/drizzle

Better Auth provides a Drizzle adapter. You pass your Drizzle DB and config.

## Example

```ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle-adapter";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool);

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", usePlural: true }),
  emailAndPassword: { enabled: true },
});
```

- `usePlural: true` if your Drizzle schema uses plural table names like `users`.
- Use CLI (`npx @better-auth/cli generate|migrate`) to create/migrate required tables.


