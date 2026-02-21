# [effect-ts-migration] Patch 3: Add mock AI service Layer for tests

## Problem Statement

The project uses custom FP utilities (`lib/utils/fp.ts`, `lib/utils/zod.ts`, `lib/utils/fp-examples.ts`) for Option, Either, and pipe. We want a single standard library (Effect-TS) for FP and dependency injection. AI usage (Q/A generation and grading) should be an injectable service so the implementation can be swapped (e.g. OpenAI now, other providers later) and tested with mocks.

## Solution Summary

Remove custom FP code and adopt Effect-TS for Option, Either, Effect, and pipe. Keep Zod for schemas and add a thin bridge where Effect and Zod interact. Define an AI service interface (Context + Tag + Layer) with two operations: generate Q/A from user content, and grade an answer against a canonical answer. Provide one implementation (e.g. OpenAI GPT-4o-mini). Ensure no custom Biome/Grit rules remain for the old FP patterns (already removed).

## Design Decisions (Non-negotiable)

- Effect-TS over custom Option/Either: one standard library, DI (Context/Tag/Layer) built in.
- AI as an Effect service: swappable provider; callers test with a mock Layer; we do not test LLM outputs (non-deterministic, hosted service).
- Zod stays for v1; minimal bridge to Effect only where we need to run validation inside Effect.

## Dependencies Completed

Patch 1 added Effect dependency and defined AI service types (`AIService` Tag, interface with `generateQuestionAnswer` and `gradeAnswer`, error types `AIGenerationError` and `GradingError`, `GradeResult` type) in `lib/ai/types.ts`.

## Your Task

**Files to create:**
- `lib/ai/ai.service.mock.ts` (or equivalent): mock Layer that returns fixed deterministic values

**Changes:**
1. Provide a mock `AIService` Layer for use in tests that depend on the AI service (e.g. callers). No tests of real LLM output—we only test deterministic local logic; the real OpenAI implementation is a hosted service with non-deterministic responses.

## Test Stubs to Add

None - this patch does not introduce test stubs.

## Tests to Unskip and Implement

None - this patch does not implement tests.

## Git Instructions

- Branch from: `effect-ts-migration/patch-1-effect-and-ai-types`
- Branch name: `effect-ts-migration/patch-3-mock-ai-service`
- PR base: `effect-ts-migration/patch-1-effect-and-ai-types`

**IMPORTANT: Open a draft PR immediately after your first commit.** Do not wait until implementation is complete. This ensures the PR title format is correct from the start.

After your first commit, run:
```bash
gh pr create --draft --title "[effect-ts-migration] Patch 3: Add mock AI service Layer for tests" --body "Work in progress" --base effect-ts-migration/patch-1-effect-and-ai-types
```

Then continue implementing. When finished:
1. Run `bun test` to verify tests pass
2. Update the PR description with a proper summary
3. Mark the PR as ready for review when complete

## PR Title (CRITICAL)

**You MUST use this EXACT title format:**

`[effect-ts-migration] Patch 3: Add mock AI service Layer for tests`

Do NOT use conventional commit format (e.g., `feat:`, `fix:`). The bracketed project name and patch number are required for tracking.
