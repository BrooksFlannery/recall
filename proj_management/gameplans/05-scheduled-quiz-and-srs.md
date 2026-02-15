# Gameplan: scheduled-quiz-and-srs

## Workstream

**Workstream**: Recall v1  
**Milestone**: 5 — scheduled-quiz-and-srs  
**Prior milestones**: 1–4 (Effect-TS, auth, facts, manual quiz)  
**Unlocks**: Grade override (M6) and polish/deploy (M7)

## Problem Statement

Users need scheduled review driven by SRS. Facts due when `next_scheduled_at <= now` should be quizzed; after each answer the system must update the fact’s SRS state: correct → level up (cap at max), non-correct → reset to level 0; set `next_scheduled_at = now + Fibonacci[srs_level]`. Users need a way to start a “due today” quiz and see how many facts are due.

## Solution Summary

Implement scheduled quiz mode: select facts where `next_scheduled_at <= now` (and user-owned); create quiz_session with mode `scheduled` and quiz_items. Reuse the same answer/grading flow as manual quiz (submitAnswer with AI grading). After storing the response, apply SRS update to the fact: if final_grade === correct then increment srs_level (max 11 per spec); else set srs_level = 0; set next_scheduled_at = now + Fibonacci[srs_level]; set last_reviewed_at = now. Add “due today” count (and optional minimal dashboard) and “Start scheduled quiz” when count > 0.

## Mergability Strategy

### Feature Flagging Strategy

Optional: `ENABLE_SCHEDULED_QUIZ` to gate. For v1 can ship without flag.

### Patch Ordering Strategy

**Early**: SRS constants (Fibonacci array, max level); helper to compute next_scheduled_at; test stubs for SRS math and scheduled start.  
**Middle**: startScheduled procedure (select due facts, create session/items); extend submitAnswer (or add applySRS) so that for scheduled sessions we update the fact after grading.  
**Late**: Due-today count API and UI; “Start scheduled quiz” entry point.

## Current State Analysis

- **After M4**: Manual quiz works; quiz_sessions, quiz_items, quiz_responses exist; grading does not touch facts. Facts table has srs_level, next_scheduled_at, last_reviewed_at.
- **Spec**: Fibonacci ladder 1,1,2,3,5,8,13,21,34,55,89,144,233 days; level 0..11 (or 0..12 per spec “Max level = 11” and 12 indices); any non-correct resets to 0.

## Required Changes

### 1. SRS logic

- Fibonacci array (days) and max level constant.
- Function: given current srs_level and grade (correct | not), return new srs_level and next_scheduled_at (now + Fibonacci[new_level] days).
- Apply to fact: update srs_level, next_scheduled_at, last_reviewed_at.

### 2. API

- `quiz.getDueCount`: () => count of facts for user where next_scheduled_at <= now.
- `quiz.startScheduled`: () => if due count 0 return error or empty; else select all due facts (or cap if desired), create session (mode scheduled), create items; return session id and items.
- `quiz.submitAnswer`: for scheduled sessions, after storing response, apply SRS update to the fact (using final_grade; in M5 final_grade = llm_grade, override in M6).

### 3. Authorization

- All scoped to current user.

### 4. UI

- Dashboard or facts page: show “X facts due today” (or “due now”); “Start scheduled quiz” button when count > 0. Reuse same quiz flow (question → answer → grade) as manual; after quiz, due count updates.

## Acceptance Criteria

- [ ] User can start a scheduled quiz (facts where next_scheduled_at <= now).
- [ ] Same answer/grading flow as manual quiz; results stored.
- [ ] After final grade: SRS updated per spec (correct → level up, non-correct → reset to 0; next_scheduled_at = now + Fibonacci[srs_level]).
- [ ] Dashboard or minimal “due today” view (e.g. count of facts due).

## Open Questions

- SRS reset policy: should `partially_correct` reset to 0 or -1 level? (Workstream: resolve by M5; spec says any non-correct resets to 0.)
- Cap number of facts in one scheduled session (e.g. all due vs max 20)?

## Explicit Opinions

- Only scheduled quizzes affect SRS; manual stays practice-only.
- Fibonacci ladder fixed; simple and well-tested.
- Any non-correct grade resets to level 0: strict but ensures mastery.

## Patches

### Patch 1 [INFRA]: SRS constants and helper

**Files to create:**
- `server/srs/constants.ts` or `lib/srs.ts`: FIBONACCI_DAYS, MAX_LEVEL
- `server/srs/apply.ts`: computeNewSrsState(grade, currentLevel) => { srs_level, next_scheduled_at }; applyToFact(factId, grade)

**Changes:**
1. Export Fibonacci array and max level; pure function for next state; function that updates fact row (srs_level, next_scheduled_at, last_reviewed_at).

### Patch 2 [INFRA]: Test stubs for SRS and scheduled quiz

**Files to create:**
- `server/srs/srs.test.ts`: correct increments level; non-correct resets to 0; next_scheduled_at is now + Fibonacci days
- Quiz test stubs: startScheduled with 0 due returns empty; startScheduled creates session; submitAnswer for scheduled session updates fact SRS

### Patch 3 [BEHAVIOR]: Implement getDueCount and startScheduled

**Files to modify:**
- Quiz router (or equivalent)

**Changes:**
1. getDueCount: count facts where user_id = session user and next_scheduled_at <= now().
2. startScheduled: if count 0 return error/empty; else select due facts, create session (scheduled), create items; return session and items.
3. Unskip startScheduled tests.

### Patch 4 [BEHAVIOR]: Apply SRS on submitAnswer for scheduled sessions

**Files to modify:**
- Quiz router; call SRS apply helper

**Changes:**
1. In submitAnswer (or after storing response): if session.mode === scheduled, load fact, call applyToFact(factId, final_grade) to update srs_level, next_scheduled_at, last_reviewed_at.
2. Unskip SRS and submit tests for scheduled.

### Patch 5 [BEHAVIOR]: Due-today UI and Start scheduled quiz

**Files to create/modify:**
- Dashboard or facts page: fetch getDueCount; display “X facts due today”; “Start scheduled quiz” (enabled when count > 0); on start call startScheduled and navigate to same quiz flow as manual.

**Changes:**
1. Wire getDueCount and startScheduled; reuse quiz view for scheduled mode; after completion, refresh due count.

## Test Map

| Test Name | File | Stub Patch | Impl Patch |
|-----------|------|------------|------------|
| SRS > correct increments level, next_scheduled_at = now + Fibonacci | server/srs/srs.test.ts | 2 | 1 (or 4) |
| SRS > non-correct resets to 0 | server/srs/srs.test.ts | 2 | 1 (or 4) |
| startScheduled > returns empty when 0 due | server/quiz/quiz.test.ts | 2 | 3 |
| startScheduled > creates session and items for due facts | server/quiz/quiz.test.ts | 2 | 3 |
| submitAnswer (scheduled) > updates fact SRS | server/quiz/quiz.test.ts | 2 | 4 |

## Dependency Graph

```
- Patch 1 [INFRA] -> []
- Patch 2 [INFRA] -> [1]
- Patch 3 [BEHAVIOR] -> [1, 2]
- Patch 4 [BEHAVIOR] -> [1, 2, 3]
- Patch 5 [BEHAVIOR] -> [3, 4]
```

**Mergability insight**: 2 of 5 patches INFRA; SRS logic then API then UI.

## Mergability Checklist

- [ ] Feature flag strategy documented (optional).
- [ ] Early patches SRS math and stubs only.
- [ ] Test stubs in Patch 2; impl in 1, 3, 4.
- [ ] Test Map complete.
- [ ] BEHAVIOR patches justified (scheduled start, SRS apply, UI).
