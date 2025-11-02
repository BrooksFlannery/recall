# Better Auth: Basic Usage (Summary)

Reference: https://www.better-auth.com/docs/basic-usage

## Enable Email & Password

```ts
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    // optional:
    // autoSignIn: false,
  },
});
```

## Client: Sign Up

```ts
import { authClient } from "@/lib/auth-client";

const { data, error } = await authClient.signUp.email(
  {
    email,
    password, // min length default 8
    name,
    image,
    callbackURL: "/",
  },
  {
    onRequest: () => {},
    onSuccess: () => {},
    onError: (ctx) => alert(ctx.error.message),
  },
);
```

## Client: Sign In

```ts
const { data, error } = await authClient.signIn.email(
  {
    email,
    password,
    callbackURL: "/",
    rememberMe: true,
  },
  {
    onSuccess: () => {},
  },
);
```

## Client: Sign Out

```ts
await authClient.signOut({
  fetchOptions: {
    onSuccess: () => {
      // e.g. router.push("/sign-in")
    },
  },
});
```

## Client: Session Hook / Getter

```ts
const { data: session, isPending, error, refetch } = authClient.useSession();
// or
const { data: session2 } = await authClient.getSession();
```

## Server: Session

```ts
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const session = await auth.api.getSession({
  headers: await headers(),
});
```


