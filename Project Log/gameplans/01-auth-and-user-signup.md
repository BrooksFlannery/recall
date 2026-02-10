# Gameplan: auth-and-user-signup

## Problem Statement

Users need secure accounts to store personal knowledge. All data is user-scoped. We need Google OAuth with database sessions and protected routes.

## Solution Summary

Use Next-Auth (Auth.js) with Google OAuth and database-backed sessions. Protected routes via middleware. User table stores profile info.

## Current State Analysis

Empty Next.js project. No auth, no database, no users.

## Required Changes

### Database Schema
```ts
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  googleId: text('google_id').notNull().unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Plus sessions, accounts tables for Auth.js
```

### Auth Configuration
```ts
export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db),
  providers: [GoogleProvider({...})],
  session: { strategy: 'database' },
}
```

## Acceptance Criteria

- [ ] User can sign in with Google
- [ ] Session persists across browser refreshes
- [ ] Protected routes redirect unauthenticated users
- [ ] Profile page displays user info

## Explicit Opinions

1. **Database sessions over JWT**: More secure, easier to revoke
2. **Google OAuth only**: 90% of users have Google accounts
3. **No password auth**: Not needed for v1
4. **Middleware protection**: All `/app/*` routes protected by default

## Patches

### Patch 1: Database schema and Auth.js configuration

**Files to create:**
- `src/db/schema.ts` (users, sessions, accounts tables)
- `src/db/migrations/0001_create_users.sql`
- `src/lib/auth.ts` (authOptions)
- `src/app/api/auth/[...nextauth]/route.ts`

**Changes:**
1. Create user, session, account tables
2. Run migration
3. Configure Auth.js with Google provider
4. Set up API route handlers

**Tests:**
- Auth config loads correctly
- OAuth flow creates user on first login
- Existing user reuses record on subsequent logins

---

### Patch 2: Protected route middleware

**Files to create:**
- `src/middleware.ts`

**Changes:**
1. Export Auth.js middleware
2. Configure matcher for `/app/*` routes

**Tests:**
- Unauthenticated requests to `/app/*` redirect to signin
- Authenticated requests pass through

---

### Patch 3: Landing page and app layout

**Files to create:**
- `src/app/page.tsx` (landing page)
- `src/components/SignInButton.tsx`
- `src/app/app/layout.tsx` (app layout with user menu)
- `src/app/app/profile/page.tsx`
- `src/components/UserMenu.tsx`

**Changes:**
1. Landing page with "Sign in with Google" button
2. App layout with user avatar dropdown
3. Profile page displays user email, name, avatar
4. Sign out button

**Tests:**
- E2E: User signs in, lands on /app, sees profile, signs out
- UI components render correctly

---

## Dependency Graph

```
- Patch 1 -> []
- Patch 2 -> [1]
- Patch 3 -> [2]
```

**3 patches total** - Linear dependencies, can be completed in ~1-2 days.
