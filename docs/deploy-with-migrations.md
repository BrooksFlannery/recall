# Deploy with Migrations - Drop-In Package

**Retrofitted for recall:** workflow is `.github/workflows/deploy.yml`, migration script is `scripts/migrate.ts` (uses `migrationsFolder: "drizzle"` and loads `.env.local` when `DATABASE_URL` is unset). Run `bun run migrations:push` to apply migrations.

---

A GitHub Actions workflow that deploys your Next.js app to Vercel and runs Drizzle ORM migrations as part of the deploy. When you merge to `main`, migrations just work.

## Why This Pattern

Without this, merging to `main` deploys new code but never runs migrations. Your app ships with new schema expectations but the database hasn't changed. Broken.

This workflow ensures:

1. **Migrations run before deploy** - Database is updated before the new app version goes live
2. **Failed migrations block deploy** - If a migration errors, the old app version stays running
3. **No version mismatch** - The app that goes live always matches the database schema it expects
4. **No manual steps** - Merge to `main` and walk away

## How It Works

On push to `main`:

```
checkout → install → pull env vars → build → run migrations → deploy
                                               ↑                 ↑
                                        If this fails,    Only runs if
                                        deploy is         migrations
                                        aborted.          succeeded.
```

The key insight: migrations run **after** the build (so build errors are caught first) but **before** the deploy (so schema mismatches can't happen). Environment variables including `DATABASE_URL` come from Vercel via `vercel pull`.

## What's Included

```
scripts/
└── migrate.ts                     # Drizzle migration runner
.github/workflows/
└── deploy.yml                     # CI workflow (push to main)
```

## Installation

### 1. Copy Files Into Your Project

Copy `scripts/` and `.github/workflows/deploy.yml` into your project root. If you already have a `.github/workflows/` folder, merge the workflow file into it.

### 2. Install Dependencies

```bash
bun add drizzle-orm postgres
bun add -d drizzle-kit
```

If you already have Drizzle set up, skip this.

### 3. Add the Migration Script to package.json

```json
{
  "scripts": {
    "migrations:push": "bun run scripts/migrate.ts",
    "migrations:generate": "drizzle-kit generate"
  }
}
```

### 4. Configure the Migration Script

Edit `scripts/migrate.ts`:

1. **Set `migrationsFolder`** to match your Drizzle config's `out` directory (e.g., `'drizzle/migrations'`, `'src/db/migrations'`)
2. **Add env loading** if needed. For Next.js projects, uncomment the `@next/env` import. Bun auto-loads `.env.local` by default which may be sufficient.

### 5. Disable Vercel's Auto-Deploy

This workflow deploys manually via the Vercel CLI. You need to turn off Vercel's automatic Git-based deploys, otherwise you'll get double deploys.

**Option A: vercel.json** (recommended)

Add to your project root:

```json
{
  "git": {
    "deploymentEnabled": false
  }
}
```

**Option B: Vercel Dashboard**

1. Go to your project in Vercel
2. **Settings** → **Git**
3. Disable "Automatically deploy when pushing to a branch"

### 6. Add GitHub Secrets

In your repository: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret | Value | Where to find it |
|--------|-------|-------------------|
| `VERCEL_TOKEN` | Vercel API token | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Your Vercel team/org ID | `.vercel/project.json` after running `vercel link`, or Vercel dashboard URL |
| `VERCEL_PROJECT_ID` | Your Vercel project ID | `.vercel/project.json` after running `vercel link` |

To get the org and project IDs quickly:

```bash
# Link your project (creates .vercel/project.json)
bunx vercel link

# Read the IDs
cat .vercel/project.json
```

### 7. Add DATABASE_URL to Vercel

Your Vercel project needs a `DATABASE_URL` environment variable pointing to your production database.

1. Go to your project in Vercel
2. **Settings** → **Environment Variables**
3. Add `DATABASE_URL` with your production Postgres connection string
4. Set it for the **Production** environment

The workflow uses `vercel pull` to fetch this into CI, where the migration script reads it.

### 8. Verify Your Drizzle Setup

Make sure you have:

- [ ] A `drizzle.config.ts` at your project root
- [ ] Schema files where your config's `schema` points
- [ ] A `migrations` folder where your config's `out` points (created by `drizzle-kit generate`)
- [ ] At least one migration file (run `bun run migrations:generate` locally to create one)

Example `drizzle.config.ts`:

```typescript
import type { Config } from 'drizzle-kit'

export default {
  schema: './src/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config
```

## Usage

### Day-to-Day Workflow

1. Change your schema files locally
2. Run `bun run migrations:generate` to create migration SQL
3. Commit both the schema changes and the generated migration
4. Open a PR, get it reviewed, merge to `main`
5. GitHub Actions builds, migrates, and deploys automatically

### Testing Migrations Locally

```bash
# Make sure DATABASE_URL is set in .env.local pointing to your local/dev DB
bun run migrations:push
```

### Creating Your First Migration

If you haven't generated any migrations yet:

```bash
# Generate migration SQL from your schema
bun run migrations:generate

# Apply it locally to verify
bun run migrations:push
```

## Adding a Staging Environment

To add a staging deploy before production (like the flowglad pattern), split into two workflows:

```yaml
# .github/workflows/deploy.yml
jobs:
  deploy-staging:
    uses: ./.github/workflows/deploy-env.yml
    with:
      environment: preview
    secrets: inherit

  deploy-production:
    needs: deploy-staging
    uses: ./.github/workflows/deploy-env.yml
    with:
      environment: production
    secrets: inherit
```

Then parameterize `deploy-env.yml` to accept an `environment` input and swap `production` for `${{ inputs.environment }}` in the `vercel pull` and `vercel build` steps.

## Troubleshooting

### "DATABASE_URL is not set"

The migration script can't find the database connection string. Causes:

- **In CI**: `vercel pull` didn't run or failed. Check the "Pull Vercel environment variables" step output.
- **In CI**: `DATABASE_URL` isn't set in your Vercel project's environment variables.
- **Locally**: Add `DATABASE_URL=postgresql://...` to `.env.local`.

### Migrations fail in CI but work locally

- Your local database and production database may have diverged. Check if someone applied manual schema changes to production.
- The migration may reference a table/column that was dropped by a previous migration. Run migrations against a clean database to verify.

### Double deploys

You're getting both a Vercel auto-deploy and the GitHub Actions deploy. Disable Vercel's auto-deploy (see step 5).

### Deploy succeeds but app shows old version

Vercel may be serving a cached version. Check the Vercel dashboard to confirm the deployment actually completed. The workflow uses `--prebuilt` which skips Vercel's build step entirely.

### "vercel pull" fails with auth error

Your `VERCEL_TOKEN` secret may be expired or invalid. Generate a new one at [vercel.com/account/tokens](https://vercel.com/account/tokens).

## Files Reference

| File | Purpose |
|------|---------|
| `.github/workflows/deploy.yml` | Deploy workflow: build → migrate → deploy on push to main |
| `scripts/migrate.ts` | Runs Drizzle migrations using `DATABASE_URL` from environment |
