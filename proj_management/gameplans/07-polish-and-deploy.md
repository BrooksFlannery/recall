# Gameplan: polish-and-deploy

## Workstream

**Workstream**: Recall v1  
**Milestone**: 7 — polish-and-deploy  
**Prior milestones**: 1–6 (Effect-TS, auth, facts, manual quiz, scheduled quiz, grade override)  
**Unlocks**: Alpha testing with real users

## Problem Statement

The app must be robust and deployable: LLM failures (Q/A generation, grading) should be handled gracefully; users should see loading states for async work; and the app should be deployed to Vercel with basic monitoring.

## Solution Summary

Add error handling for AI service failures: when generating Q/A (fact create/edit) or grading (quiz), surface user-friendly messages and retry or fallback where appropriate. Add loading states for all async operations (fact list, add, edit, delete; quiz start, submit, finish; override save). Deploy to Vercel: configure project, env vars, and add minimal monitoring (e.g. health check, error tracking or logging).

## Mergability Strategy

### Feature Flagging Strategy

Not needed. Polish and deploy are the final milestone.

### Patch Ordering Strategy

**Early**: Error types and handling helpers; loading-state components or patterns.  
**Middle**: Wire error handling and loading states into existing flows (facts, quiz, override).  
**Late**: Vercel config, deployment, monitoring.

## Current State Analysis

- **After M6**: Full feature set: facts CRUD, manual quiz, scheduled quiz, grade override. AI calls can fail (network, rate limit, model error); some flows may not show loading or clear errors. No production deployment or monitoring.

## Required Changes

### 1. Error handling for LLM

- **Q/A generation** (fact create/edit): On AIService failure, show user-facing message (e.g. “Could not generate questions. Please try again.”); optionally retry once; do not save fact with empty question/answer. Log error for debugging.
- **Grading** (quiz submit): On AIService failure, show message (e.g. “Could not grade answer. Please try again.”); allow retry for that item or skip; store response with error state if needed (e.g. llm_grade = null, or a dedicated “grading_failed” state). Log error.

### 2. Loading states

- Fact list: loading skeleton or spinner while fetching.
- Add fact: disable submit, show spinner or “Generating…” while AI runs.
- Edit fact: same for save.
- Delete: loading on confirm (if async).
- Quiz: loading when starting quiz; loading when submitting answer; loading when finishing or saving overrides.
- Override: loading when saving override.

### 3. Vercel deployment

- Connect repo to Vercel; set build command and output (Next.js default).
- Configure env vars: database URL, Better Auth secret/URL, Google OAuth, OpenAI API key, etc.
- Ensure server/API routes and DB work in Vercel (serverless); run migrations or use Vercel Postgres/Neon integration as needed.

### 4. Monitoring

- Health check endpoint (e.g. `/api/health`) for uptime checks.
- Error tracking: Vercel Analytics or integrate Sentry (or similar) for unhandled errors and API failures. At minimum: log errors; optionally report to external service.

## Acceptance Criteria

- [ ] Error handling for LLM failures (Q/A generation and grading): user sees clear message; no silent failures.
- [ ] Loading states for all async operations (facts, quiz, override).
- [ ] Deployed to Vercel with monitoring (health check; error logging or tracking).

## Open Questions

- Retry policy for LLM calls: once, twice, or no retry (show error immediately)?
- Sentry vs Vercel-only logging for v1.

## Explicit Opinions

- User-facing errors should be friendly and actionable; avoid exposing stack traces or provider messages.
- Loading states reduce perceived latency and prevent double-submit.

## Patches

### Patch 1 [INFRA]: Error types and user-facing message helpers

**Files to create/modify:**
- `lib/errors.ts` or similar: AIGenerationError, GradingError (or reuse from AI service); map to user message (e.g. “Could not generate questions. Please try again.”).

**Changes:**
1. Centralize user-facing error messages for AI failures; optional codes for analytics.

### Patch 2 [INFRA]: Loading state components or hooks

**Files to create:**
- Reusable loading spinner/skeleton components (or use shadcn if available); optional `useLoadingState` or integrate with React Query loading flags.

**Changes:**
1. Components or patterns used across facts and quiz flows; no behavior change yet.

### Patch 3 [BEHAVIOR]: Wire error handling for Q/A generation

**Files to modify:**
- Fact create/edit flow (API and UI)

**Changes:**
1. On AIService failure in create/update: return or throw with user message; UI shows error toast or inline message; do not save fact with empty Q/A. Optional retry.
2. Log error server-side.

### Patch 4 [BEHAVIOR]: Wire error handling for grading

**Files to modify:**
- Quiz submit flow (API and UI)

**Changes:**
1. On AIService failure in submitAnswer: return error to client; UI shows message; allow retry or skip. Optionally store response with “grading_failed” so user can retry later.
2. Log error server-side.

### Patch 5 [BEHAVIOR]: Add loading states to all async flows

**Files to modify:**
- Facts list, Add Fact modal, Edit Fact modal, Delete; Quiz start, submit, finish; Override save

**Changes:**
1. Disable buttons or show spinner during async calls; use React Query isPending or local state. Ensure no double-submit.

### Patch 6 [BEHAVIOR]: Vercel project and env config

**Files to create/modify:**
- `vercel.json` if needed; Vercel project settings (via dashboard or CLI)
- `.env.example` with all required vars (no secrets)

**Changes:**
1. Document and set env vars in Vercel; verify build and runtime (Next.js, serverless). Run DB migrations (manual or CI).

### Patch 7 [BEHAVIOR]: Health check and monitoring

**Files to create/modify:**
- `app/api/health/route.ts`: return 200 and optionally DB ping
- Integrate error reporting (Sentry or Vercel) for API and client errors

**Changes:**
1. Health endpoint for uptime checks. Configure error tracking; ensure critical paths log or report failures.

## Test Map

| Test Name | File | Stub Patch | Impl Patch |
|-----------|------|------------|------------|
| Error mapping > returns user message for AIGenerationError | lib/errors.test.ts | 1 | 1 |
| Health > returns 200 | app/api/health/route.test.ts | 7 | 7 |

(Loading states are UI; optional E2E or manual check; workstream is unit tests only.)

## Dependency Graph

```
- Patch 1 [INFRA] -> []
- Patch 2 [INFRA] -> []
- Patch 3 [BEHAVIOR] -> [1]
- Patch 4 [BEHAVIOR] -> [1]
- Patch 5 [BEHAVIOR] -> [2]
- Patch 6 [BEHAVIOR] -> []
- Patch 7 [BEHAVIOR] -> []
```

**Mergability insight**: 2 of 7 patches INFRA; behavior patches can be parallelized (3, 4, 5, 6, 7) after 1 and 2.

## Mergability Checklist

- [ ] Feature flag strategy documented (not needed).
- [ ] Early patches error types and loading components only.
- [ ] Test stubs/impl for error mapping and health.
- [ ] BEHAVIOR patches justified (errors, loading, deploy, monitoring).
