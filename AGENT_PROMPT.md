# [effect-ts-migration] Patch 1: Add Effect dependency and AI service types

## Problem Statement

The project uses custom FP utilities (`lib/utils/fp.ts`, `lib/utils/zod.ts`, `lib/utils/fp-examples.ts`) for Option, Either, and pipe. We want a single standard library (Effect-TS) for FP and dependency injection. AI usage (Q/A generation and grading) should be an injectable service so the implementation can be swapped (e.g. OpenAI now, other providers later) and tested with mocks.

## Solution Summary

Remove custom FP code and adopt Effect-TS for Option, Either, Effect, and pipe. Keep Zod for schemas and add a thin bridge where Effect and Zod interact. Define an AI service interface (Context + Tag + Layer) with two operations: generate Q/A from user content, and grade an answer against a canonical answer. Provide one implementation (e.g. OpenAI GPT-4o-mini). Ensure no custom Biome/Grit rules remain for the old FP patterns (already removed).

## Design Decisions (Non-negotiable)

- Effect-TS over custom Option/Either: one standard library, DI (Context/Tag/Layer) built in.
- AI as an Effect service: swappable provider; callers test with a mock Layer; we do not test LLM outputs (non-deterministic, hosted service).
- Zod stays for v1; minimal bridge to Effect only where we need to run validation inside Effect.

## Dependencies Completed

None - this patch has no dependencies.

## Your Task

**Files to create/modify:**
- `package.json` (add `effect`)
- `lib/ai/types.ts`: Tag, interface, error and result types

**Changes:**
1. Add `effect` dependency.
2. Define `AIService` Tag and interface (`generateQuestionAnswer`, `gradeAnswer`).
3. Define `AIGenerationError`, `GradingError` as `{ _tag; message: string; code?: string }`; `GradeResult` as `{ grade: "correct" | "partial" | "incorrect"; confidence: number; rationale: string }` (confidence 0–1).

## Test Stubs to Add

None - this patch does not introduce test stubs.

## Tests to Unskip and Implement

None - this patch does not implement tests.

## Git Instructions

- Branch from: `main`
- Branch name: `effect-ts-migration/patch-1-effect-and-ai-types`
- PR base: `main`

**IMPORTANT: Open a draft PR immediately after your first commit.** Do not wait until implementation is complete. This ensures the PR title format is correct from the start.

After your first commit, run:
```bash
gh pr create --draft --title "[effect-ts-migration] Patch 1: Add Effect dependency and AI service types" --body "Work in progress" --base main
```

Then continue implementing. When finished:
1. Run `bun test` to verify tests pass
2. Update the PR description with a proper summary
3. Mark the PR as ready for review when complete

## PR Title (CRITICAL)

**You MUST use this EXACT title format:**

`[effect-ts-migration] Patch 1: Add Effect dependency and AI service types`

Do NOT use conventional commit format (e.g., `feat:`, `fix:`). The bracketed project name and patch number are required for tracking.
