# Better Auth: PostgreSQL Adapter (Summary)

Reference: https://www.better-auth.com/docs/adapters/postgresql

Better Auth can use a native `pg` Pool directly.

## Example

```ts
import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL!,
  }),
});
```

## Non-default Schema (optional)

Use `search_path` in the connection string or DB user defaults.

```sql
CREATE SCHEMA IF NOT EXISTS auth;
ALTER USER your_user SET search_path TO auth;
```

Troubleshooting: ensure schema exists and permissions are granted.


