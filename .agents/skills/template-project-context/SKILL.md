---
name: template-project-context
description: Project context for this template repo - tech stack, code standards, and reference files. Use when working in this codebase to align with its tooling and conventions.
---

# Template Project Context

## Tech Stack

- **Runtime:** Bun
- **Linter/Formatter:** Biome
- **Testing:** bun test
- **Framework:** Next.js
- **API Layer:** tRPC
- **UI Components:** shadcn/ui
- **Authentication:** BetterAuth
- **Validation:** Zod
- **Database:** Neon (Postgres)
- **ORM:** Drizzle

## Code Standards

- Hardcore functional programming whenever possible
- Custom FP utilities (Option, Either, pipe) — built from scratch
- Type-safe patterns throughout
- Standards will evolve as the project develops

## Reference Files

- See `@lib/utils/fp-examples.ts` for idiomatic examples of using Option, Either, and pipe patterns
