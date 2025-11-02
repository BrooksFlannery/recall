# Better Auth: Next.js (App Router) Integration (Summary)

Reference: https://www.better-auth.com/docs/integrations/next

## API Route

```ts
// app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth.handler);
```

## Server Session in App Router

```ts
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const session = await auth.api.getSession({ headers: await headers() });
```

## Client: Auth Client & Hooks

```ts
// src/lib/auth-client.ts
import { createAuthClient } from "better-auth/client/react";

export const authClient = createAuthClient({});

// in components
const { data: session } = authClient.useSession();
```

## Cookie Handling

Better Auth provides a Next.js cookies integration internally with `toNextJsHandler` to manage Set-Cookie on responses.


