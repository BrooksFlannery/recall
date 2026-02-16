# Gameplan: effect-ts-migration

## Workstream

**Workstream**: Recall v1  
**Milestone**: 1 — effect-ts-migration  
**Prior milestones**: None  
**Unlocks**: Auth and all subsequent milestones (Effect + swappable AI as foundation)

## Problem Statement

The project uses custom FP utilities (`lib/utils/fp.ts`, `lib/utils/zod.ts`, `lib/utils/fp-examples.ts`) for Option, Either, and pipe. We want a single standard library (Effect-TS) for FP and dependency injection. AI usage (Q/A generation and grading) should be an injectable service so the implementation can be swapped (e.g. OpenAI now, other providers later) and tested with mocks.

## Solution Summary

Remove custom FP code and adopt Effect-TS for Option, Either, Effect, and pipe. Keep Zod for schemas and add a thin bridge where Effect and Zod interact. Define an AI service interface (Context + Tag + Layer) with two operations: generate Q/A from user content, and grade an answer against a canonical answer. Provide one implementation (e.g. OpenAI GPT-4o-mini). Ensure no custom Biome/Grit rules remain for the old FP patterns (already removed).

## Mergability Strategy

### Feature Flagging Strategy

Not needed. This is foundational infrastructure. No user-facing feature flags.

### Patch Ordering Strategy

**Early**: Add Effect dependency; define AI service interface and Tag; add Zod–Effect bridge; optional mock Layer for tests.  
**Middle**: Implement OpenAI AI service; add Layer.  
**Late**: Migrate/remove `fp.ts`, `zod.ts`, `fp-examples.ts`; update any call sites to use Effect and the AI service.

## Current State Analysis

- **`lib/utils/fp.ts`**: Custom Option, Either, pipe, map, flatMap, getOrElse, fromNullable, etc. Used by `lib/utils/zod.ts` and `lib/utils/fp-examples.ts`.
- **`lib/utils/zod.ts`**: `parseOption`, `parseEither`, etc. wrapping Zod with custom Option/Either.
- **`lib/utils/fp-examples.ts`**: Examples using custom FP.
- **Biome/Grit**: FP-related rules already removed from biome config; no grit files for Option/Either.
- **AI**: No abstraction yet; no LLM calls in codebase.
- **tRPC**: Present; oRPC migration is out of scope for this gameplan (later milestone or separate).

## Required Changes

### 1. Effect and AI service types

- Add `effect` (and optionally `@effect/schema` only if we add a minimal bridge; spec says Zod stays for v1).
- Create an AI service module in `lib/ai/types.ts`:
  - Tag: `AIService`
  - Interface: `generateQuestionAnswer(userContent: string) => Effect<{ question: string, canonicalAnswer: string }, AIGenerationError>`, `gradeAnswer(params: { userAnswer: string, canonicalAnswer: string }) => Effect<GradeResult, GradingError>`.
  - Types: `AIGenerationError` and `GradingError` as `{ _tag; message: string; code?: string }`; `GradeResult` as `{ grade: "correct" | "partial" | "incorrect"; confidence: number; rationale: string }` (confidence 0–1).

### 2. Zod–Effect bridge (minimal)

- Small helpers that turn `schema.safeParse(x)` into `Effect.succeed(data) | Effect.fail(ZodError)` so existing Zod schemas can be used inside Effect.

### 3. OpenAI implementation

- Implement the AI service interface using OpenAI GPT-4o-mini: one implementation module that provides a Layer.

### 4. Remove custom FP

- Delete or replace `lib/utils/fp.ts`, `lib/utils/zod.ts`, `lib/utils/fp-examples.ts`.
- Replace any usages with Effect (`Option`, `Either`, `Effect`, `pipe` from `effect`) and the new Zod bridge.

### 5. Verification

- No remaining imports from `./fp` or `lib/utils/fp`.
- AI service can be run with OpenAI Layer in app; tests use a mock Layer for any code that depends on AIService.
- **Testing scope**: Only deterministic local functions are unit-tested (e.g. Zod–Effect bridge, types). We do not test LLM outputs—they are non-deterministic and the provider is a hosted service.

## Acceptance Criteria

- [ ] Custom FP utilities (`lib/utils/fp.ts`, `lib/utils/zod.ts`, `lib/utils/fp-examples.ts`) removed and replaced with Effect-TS.
- [ ] Effect used for Option, Either, Effect, pipe; Zod kept for schemas with an Effect-friendly bridge where needed.
- [ ] AI usage defined as an Effect service (Context + Tag + Layer): interface for Q/A generation and answer grading; implementation can be swapped (e.g. OpenAI now).
- [ ] No custom Biome/Grit rules for old FP patterns (already removed).
- [ ] Project builds and existing tests (if any) pass; new unit tests only for deterministic logic (Zod–Effect bridge, types); AI callers use a mock Layer; no tests of LLM output.

## Decisions (recorded)

- **File layout**: `lib/ai/types.ts` for AIService interface and shared types; `server/ai/` for OpenAI implementation (and mock can live in `lib/ai/` or `server/ai/`).
- **GradeResult**: `{ grade: "correct" | "partial" | "incorrect"; confidence: number; rationale: string }` with confidence in 0–1.
- **AIGenerationError / GradingError**: `{ _tag: "AIGenerationError" | "GradingError"; message: string; code?: string }`. No `cause` for v1 (optional later for error chaining if we want to attach the underlying API error for debugging).
- **fp-examples.ts**: Remove; do not replace with Effect examples for v1.

## Open Questions

- None for this gameplan.

## Explicit Opinions

- Effect-TS over custom Option/Either: one standard library, DI (Context/Tag/Layer) built in.
- AI as an Effect service: swappable provider; callers test with a mock Layer; we do not test LLM outputs (non-deterministic, hosted service).
- Zod stays for v1; minimal bridge to Effect only where we need to run validation inside Effect.

## Patches

### Patch 1 [INFRA]: Add Effect dependency and AI service types

**Files to create/modify:**
- `package.json` (add `effect`)
- `lib/ai/types.ts`: Tag, interface, error and result types

**Changes:**
1. Add `effect` dependency.
2. Define `AIService` Tag and interface (`generateQuestionAnswer`, `gradeAnswer`).
3. Define `AIGenerationError`, `GradingError` as `{ _tag; message: string; code?: string }`; `GradeResult` as `{ grade: "correct" | "partial" | "incorrect"; confidence: number; rationale: string }` (confidence 0–1).

### Patch 2 [INFRA]: Add Zod–Effect bridge

**Files to create:**
- `lib/utils/zod-effect.ts` (or similar): `parseZodToEffect(schema, value) => Effect<T, ZodError>`

**Changes:**
1. Thin helper that wraps `schema.safeParse` in Effect.succeed / Effect.fail.

### Patch 3 [INFRA]: Add mock AI service Layer for tests (optional)

**Files to create:**
- `lib/ai/ai.service.mock.ts` (or equivalent): mock Layer that returns fixed deterministic values

**Changes:**
1. Provide a mock `AIService` Layer for use in tests that depend on the AI service (e.g. callers). No tests of real LLM output—we only test deterministic local logic; the real OpenAI implementation is a hosted service with non-deterministic responses.

### Patch 4 [GATED]: Implement OpenAI AI service and Layer

**Files to create:**
- `server/ai/openai-ai.service.ts` (or `lib/ai/openai.ts`): implementation of AIService interface, OpenAI client calls, Layer

**Changes:**
1. Implement `generateQuestionAnswer` and `gradeAnswer` using OpenAI GPT-4o-mini.
2. Export `OpenAIAIServiceLayer` (or similar) that provides the service.
3. No unit tests for LLM output (non-deterministic, hosted); any tests that need AIService use the mock Layer from Patch 3.

### Patch 5 [BEHAVIOR]: Remove custom FP and migrate usages to Effect

**Files to modify/delete:**
- Remove `lib/utils/fp.ts`, `lib/utils/zod.ts`, `lib/utils/fp-examples.ts`
- Update any files that import from these to use `effect` and the new Zod–Effect bridge

**Changes:**
1. Find all imports of `./fp`, `utils/fp`, `utils/zod`, `fp-examples`; replace with Effect + bridge.
2. Delete the three files.
3. Ensure build and tests pass.

### Patch 6 [INFRA]: Wire AI service in app root (optional / placeholder)

**Files to modify:**
- App entry or server root where Effect program runs (if applicable)

**Changes:**
1. Provide the AI service Layer so that any code requiring AIService can run. May be minimal if no callers yet (just dependency wiring for later gameplans).

## Test Map

Only deterministic local behavior is tested. LLM outputs are not tested (non-deterministic; hosted service).

| Test Name | File | Patch |
|-----------|------|-------|
| Zod–Effect bridge > parseZodToEffect succeeds on valid input | lib/utils/zod-effect.test.ts | 2 |
| Zod–Effect bridge > parseZodToEffect fails on invalid input (typed ZodError) | lib/utils/zod-effect.test.ts | 2 |

## Dependency Graph

```
- Patch 1 [INFRA] -> []
- Patch 2 [INFRA] -> [1]
- Patch 3 [INFRA] -> [1]
- Patch 4 [GATED] -> [1]
- Patch 5 [BEHAVIOR] -> [1, 2]
- Patch 6 [INFRA] -> [4]
```

**Mergability insight**: 4 of 6 patches are `[INFRA]`/`[GATED]`; only Patch 5 changes observable behavior by removing old FP and switching to Effect.

## Mergability Checklist

- [ ] Feature flag strategy documented (not needed — infra only).
- [ ] Early patches contain only non-functional changes (`[INFRA]`).
- [ ] Mock Layer for AIService in Patch 3 for callers that need it; no tests of LLM output.
- [ ] Test Map covers only deterministic logic (Zod–Effect bridge).
- [ ] `[BEHAVIOR]` patch (5) is justified: removal of old FP and migration to Effect.
