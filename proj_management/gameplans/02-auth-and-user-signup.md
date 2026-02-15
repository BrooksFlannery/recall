# Gameplan: auth-and-user-signup

## Workstream

**Workstream**: Recall v1  
**Milestone**: 2 — auth-and-user-signup  
**Prior milestones**: 1 (effect-ts-migration)  
**Unlocks**: User-scoped facts and quizzes (Milestone 3+)

## Problem Statement

Users need secure accounts to store personal knowledge. All data is user-scoped. We need Google OAuth and email/password sign-in with database-backed sessions, protected routes, and a minimal profile experience.

## Solution Summary

Use Better Auth with Drizzle adapter: Google OAuth and email/password enabled, database sessions, PostgreSQL (Neon). Protect app routes via middleware; redirect unauthenticated users to login. Provide landing page, sign-in (Google + email/password), and a profile page showing basic user info.

## Mergability Strategy

### Feature Flagging Strategy

Not needed. Auth is foundational; no gating of auth itself. Optional: env flag to disable email/password or Google in dev — out of scope unless desired.

### Patch Ordering Strategy

**Early**: Database schema (users + Better Auth tables), Better Auth config and API route, Drizzle adapter.  
**Middle**: Middleware for protected routes; client auth helpers.  
**Late**: Landing page, sign-in UI (Google + email/password), app layout, profile page.

## Current State Analysis

- **After M1**: Effect-TS and AI service in place; no auth.
- **Database**: PostgreSQL (Neon) + Drizzle; schema may exist from project setup but no users/auth tables.
- **API**: tRPC present; oRPC migration is separate. Auth is independent (Better Auth has its own `/api/auth/*`).
- **UI**: No auth flows, no protected layout.

## Required Changes

### 1. Database schema

- Users table compatible with Better Auth (id, email, name, image, emailVerified, etc.); plus `password_hash` for email/password (or rely on Better Auth’s schema).
- Better Auth tables: session, account, verification (per Better Auth + Drizzle adapter docs).
- Use `npx @better-auth/cli generate` and/or manual Drizzle schema; run migrations.

### 2. Better Auth configuration

- `auth.ts` (or `lib/auth.ts`): `betterAuth({ database: drizzleAdapter(db), emailAndPassword: { enabled: true }, socialProviders: { google: { clientId, clientSecret } }, session: { ... } })`.
- Env: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

### 3. API route

- Next.js route: `app/api/auth/[...all]/route.ts` wiring Better Auth handler.

### 4. Middleware

- Protect `/app/*` (or chosen app prefix): if no session, redirect to sign-in page. Use Better Auth’s `auth.api.getSession()` or equivalent in middleware.

### 5. Client

- Auth provider / hooks for session (e.g. React context or Better Auth client).
- Sign-in page: “Sign in with Google” button + email/password form (email + password, sign up / sign in).
- App layout: user menu (avatar, name, sign out); profile page with basic user info.

## Acceptance Criteria

- [ ] User can sign in with Google OAuth.
- [ ] User can sign in with email/password.
- [ ] Session persists across browser refreshes.
- [ ] Protected routes redirect unauthenticated users to login.
- [ ] User profile page displays basic user info (e.g. email, name, avatar).

## Open Questions

- Exact path for “app” area: `/app/*` vs `/dashboard/*` (workstream says “protected routes”; assume `/app` unless decided otherwise).
- Whether to add “forgot password” in v1 (workstream out-of-scope: “email verification flows” — clarify if forgot password is in or out).

## Explicit Opinions

- Database sessions over JWT: better security, easier revocation (per workstream).
- Google OAuth + email/password: flexibility for users who prefer either.
- Middleware protection: all app routes protected by default; landing and sign-in public.

## Patches

### Patch 1 [INFRA]: Database schema for Better Auth

**Files to create/modify:**
- `server/db/schema.ts` (or existing schema file): users, session, account, verification tables per Better Auth + Drizzle
- Migration file

**Changes:**
1. Add Better Auth–compatible user and auth tables (or use CLI-generated schema).
2. Run migration.

### Patch 2 [INFRA]: Better Auth config and API route

**Files to create:**
- `lib/auth.ts` (or `server/auth.ts`): Better Auth config with Drizzle adapter, `emailAndPassword.enabled`, `socialProviders.google`
- `app/api/auth/[...all]/route.ts`: export Better Auth handler

**Changes:**
1. Configure `betterAuth({ database, emailAndPassword, socialProviders, secret, baseURL })`.
2. Wire handler in route.
3. Document env vars (BETTER_AUTH_SECRET, BETTER_AUTH_URL, Google credentials).

### Patch 3 [INFRA]: Auth client and session helper

**Files to create:**
- `lib/auth-client.ts`: Better Auth client for browser (e.g. `createAuthClient`)
- Optional: `lib/session.ts` or hook for `getSession()` in React

**Changes:**
1. Create auth client for sign-in/sign-out and session fetching.
2. Expose hook or helper for components to read session.

### Patch 4 [BEHAVIOR]: Protected route middleware

**Files to create/modify:**
- `middleware.ts`

**Changes:**
1. For routes under `/app` (or chosen prefix), call Better Auth session check; if no session, redirect to sign-in.
2. Allow public access to landing and `/api/auth/*`.

### Patch 5 [BEHAVIOR]: Landing and sign-in UI

**Files to create:**
- `app/page.tsx`: landing with “Sign in with Google” and link to email/password sign-in
- `app/(auth)/sign-in/page.tsx` (or equivalent): Google button + email/password form (sign in / sign up)

**Changes:**
1. Landing page and sign-in page using auth client (signIn with Google, signIn with email/password).
2. Redirect to `/app` after successful sign-in.

### Patch 6 [BEHAVIOR]: App layout and profile page

**Files to create:**
- `app/app/layout.tsx`: layout that requires session; user menu (avatar, name, sign out)
- `app/app/profile/page.tsx`: display user email, name, avatar
- Optional: `components/UserMenu.tsx`, `components/SignInButton.tsx`

**Changes:**
1. App layout reads session; redirect to sign-in if missing (or rely on middleware).
2. Profile page shows basic user info; sign out from menu.

## Test Map

| Test Name | File | Stub Patch | Impl Patch |
|-----------|------|------------|------------|
| Auth config > loads without throw | lib/auth.test.ts | 2 | 2 |
| Middleware > redirects unauthenticated to sign-in | middleware.test.ts | 4 | 4 |
| Session helper > returns session when cookie present | lib/session.test.ts | 3 | 3 |

(Bun unit tests only; no E2E per workstream.)

## Dependency Graph

```
- Patch 1 [INFRA] -> []
- Patch 2 [INFRA] -> [1]
- Patch 3 [INFRA] -> [2]
- Patch 4 [BEHAVIOR] -> [2, 3]
- Patch 5 [BEHAVIOR] -> [3]
- Patch 6 [BEHAVIOR] -> [3, 4]
```

**Mergability insight**: 3 of 6 patches are `[INFRA]`; behavior patches are middleware and UI.

## Mergability Checklist

- [ ] Feature flag strategy documented (not needed).
- [ ] Early patches are schema and config only.
- [ ] Test stubs in INFRA patches where applicable.
- [ ] Test implementations with same patch as code.
- [ ] `[BEHAVIOR]` patches justified (middleware and UI required for “done”).
