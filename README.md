# Template

A modern web application built with functional programming principles.

## Tech Stack

- **Runtime**: Bun
- **Framework**: Next.js 15
- **API Layer**: tRPC
- **UI Components**: shadcn/ui
- **Authentication**: BetterAuth
- **Database**: Neon (Postgres) / Local Postgres
- **ORM**: Drizzle
- **Linting/Formatting**: Biome
- **Testing**: bun test
- **Functional Programming**: Custom FP utilities (Option, Either, pipe)

## Getting Started

### Prerequisites

- Bun >= 1.0.0
- Docker (for local database)

### Installation

```bash
bun install
```

### Database Setup

Set up and run the local PostgreSQL database:

```bash
bun run db:setup
```

This command will:
- Start a PostgreSQL container in Docker
- Wait for the database to be ready
- Run any pending migrations
- Set up your `.env` file if it doesn't exist

**Database Commands:**
- `bun run db:setup` - Set up and start the database
- `bun run db:up` - Start the database container
- `bun run db:down` - Stop the database container
- `bun run db:reset` - Reset the database (removes all data)
- `bun run db:generate` - Generate migrations from schema changes
- `bun run db:migrate` - Run pending migrations
- `bun run db:push` - Push schema changes directly (dev only)
- `bun run db:studio` - Open Drizzle Studio (database GUI)

**Local Database Connection:**
```
postgresql://recall:recall@localhost:5432/recall
```

### Development

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Code Quality

```bash
# Lint and format
bun run lint:fix

# Type check
bun run type-check

# Run pre-commit checks (lint + type-check)
# Use this before committing to catch issues early
bun run pre-commit
```

**Git Hooks:**
Pre-commit hooks are automatically installed when you run `bun install`. The hook runs `bun run pre-commit` before each commit to ensure code quality. If you need to manually install or reinstall the hooks:

```bash
bun run install-git-hooks
```

## Project Structure

```
template/
├── app/              # Next.js app directory
├── server/           # Server-side code
│   ├── db/          # Database schema and connection
│   ├── trpc/        # tRPC routers and procedures
│   └── auth.ts      # BetterAuth configuration
├── lib/              # Shared utilities
│   ├── utils/       # Utility functions
│   │   └── fp.ts    # Custom functional programming utilities
│   └── trpc/        # tRPC client setup
├── drizzle/          # Database migrations (generated)
├── scripts/          # Utility scripts
└── components/       # React components (shadcn/ui)
```

## Code Standards

- **Functional Programming First**: Prefer pure functions and monadic types
- **Type Safety**: Leverage TypeScript's type system fully
- **Monads**: Use Option for nullable values, Either for error handling
- **Composition**: Compose functions over classes using pipe
- **Custom Utilities**: Built from scratch to understand how they work

## Agent Guidelines

Agent configuration lives in [`.agents/`](./.agents/) as skills. See `.agents/skills/` for project context, behavioral rules, and FP philosophy used by AI agents in this codebase.
