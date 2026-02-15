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

**Early**: Add Effect dependency; define AI service interface and Tag; add Zod–Effect bridge; test stubs.  
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
- Create an AI service module (e.g. `lib/ai/types.ts` or `server/ai/types.ts`):
  - Tag: `AIService`
  - Interface: `generateQuestionAnswer(userContent: string) => Effect<{ question: string, canonicalAnswer: string }, AIGenerationError>`, `gradeAnswer(params: { userAnswer: string, canonicalAnswer: string }) => Effect<GradeResult, GradingError>`.
  - Types: `AIGenerationError`, `GradingError`, `GradeResult` (grade enum, confidence, rationale).

### 2. Zod–Effect bridge (minimal)

- Small helpers that turn `schema.safeParse(x)` into `Effect.succeed(data) | Effect.fail(ZodError)` so existing Zod schemas can be used inside Effect.

### 3. OpenAI implementation

- Implement the AI service interface using OpenAI GPT-4o-mini: one implementation module that provides a Layer.

### 4. Remove custom FP

- Delete or replace `lib/utils/fp.ts`, `lib/utils/zod.ts`, `lib/utils/fp-examples.ts`.
- Replace any usages with Effect (`Option`, `Either`, `Effect`, `pipe` from `effect`) and the new Zod bridge.

### 5. Verification

- No remaining imports from `./fp` or `lib/utils/fp`.
- AI service can be run with OpenAI Layer in app; tests can use a mock Layer.

## Acceptance Criteria

- [ ] Custom FP utilities (`lib/utils/fp.ts`, `lib/utils/zod.ts`, `lib/utils/fp-examples.ts`) removed and replaced with Effect-TS.
- [ ] Effect used for Option, Either, Effect, pipe; Zod kept for schemas with an Effect-friendly bridge where needed.
- [ ] AI usage defined as an Effect service (Context + Tag + Layer): interface for Q/A generation and answer grading; implementation can be swapped (e.g. OpenAI now).
- [ ] No custom Biome/Grit rules for old FP patterns (already removed).
- [ ] Project builds and existing tests (if any) pass; new unit tests for AI service interface and OpenAI implementation where appropriate.

## Open Questions

- Exact file layout for `server/ai` vs `lib/ai` (server-only vs shared types).
- Whether to keep `fp-examples.ts` as Effect examples or remove entirely (spec says remove).

## Explicit Opinions

- Effect-TS over custom Option/Either: one standard library, DI (Context/Tag/Layer) built in.
- AI as an Effect service: swappable provider, testable with mocks.
- Zod stays for v1; minimal bridge to Effect only where we need to run validation inside Effect.

## Patches

### Patch 1 [INFRA]: Add Effect dependency and AI service types

**Files to create/modify:**
- `package.json` (add `effect`)
- `lib/ai/types.ts` (or `server/ai/types.ts`): Tag, interface, error and result types

**Changes:**
1. Add `effect` dependency.
2. Define `AIService` Tag and interface (`generateQuestionAnswer`, `gradeAnswer`).
3. Define `AIGenerationError`, `GradingError`, `GradeResult` (grade, confidence, rationale).

### Patch 2 [INFRA]: Add Zod–Effect bridge

**Files to create:**
- `lib/utils/zod-effect.ts` (or similar): `parseZodToEffect(schema, value) => Effect<T, ZodError>`

**Changes:**
1. Thin helper that wraps `schema.safeParse` in Effect.succeed / Effect.fail.

### Patch 3 [INFRA]: Add test stubs for AI service

**Files to create:**
- `lib/ai/ai.service.test.ts` (or equivalent)

**Changes:**
1. Test stubs with `.skip`: generateQuestionAnswer returns structured Q/A; gradeAnswer returns grade + confidence + rationale; failures are typed.
2. Document stub → implementation patch in Test Map.

### Patch 4 [GATED]: Implement OpenAI AI service and Layer

**Files to create:**
- `server/ai/openai-ai.service.ts` (or `lib/ai/openai.ts`): implementation of AIService interface, OpenAI client calls, Layer

**Changes:**
1. Implement `generateQuestionAnswer` and `gradeAnswer` using OpenAI GPT-4o-mini.
2. Export `OpenAIAIServiceLayer` (or similar) that provides the service.
3. Unskip and implement tests that use the real Layer (or a test double).

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

| Test Name | File | Stub Patch | Impl Patch |
|-----------|------|------------|------------|
| AIService > generateQuestionAnswer returns question and canonicalAnswer | lib/ai/ai.service.test.ts | 3 | 4 |
| AIService > gradeAnswer returns grade, confidence, rationale | lib/ai/ai.service.test.ts | 3 | 4 |
| Zod–Effect bridge > parseZodToEffect succeeds on valid input | lib/utils/zod-effect.test.ts | 2 | 2 (same patch) or 5 |

## Dependency Graph

```
- Patch 1 [INFRA] -> []
- Patch 2 [INFRA] -> [1]
- Patch 3 [INFRA] -> [1]
- Patch 4 [GATED] -> [1, 3]
- Patch 5 [BEHAVIOR] -> [1, 2]
- Patch 6 [INFRA] -> [4]
```

**Mergability insight**: 4 of 6 patches are `[INFRA]`/`[GATED]`; only Patch 5 changes observable behavior by removing old FP and switching to Effect.

## Mergability Checklist

- [ ] Feature flag strategy documented (not needed — infra only).
- [ ] Early patches contain only non-functional changes (`[INFRA]`).
- [ ] Test stubs with `.skip` in `[INFRA]` patches where applicable.
- [ ] Test implementations co-located with code (Patch 4).
- [ ] Test Map complete; Impl Patch matches implementation patch.
- [ ] `[BEHAVIOR]` patch (5) is justified: removal of old FP and migration to Effect.
