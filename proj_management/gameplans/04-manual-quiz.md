# Gameplan: manual-quiz

## Workstream

**Workstream**: Recall v1  
**Milestone**: 4 — manual-quiz  
**Prior milestones**: 1–3 (Effect-TS, auth, facts list/add/edit/delete)  
**Unlocks**: Scheduled quiz (M5) reuses grading flow; grade override (M6) applies to both quiz types

## Problem Statement

Users need to practice recall without affecting their SRS schedule. A manual quiz should present up to 10 random facts (or all if fewer), let the user type an answer per fact, grade via LLM, and record the session and responses—without changing any fact’s SRS level or next_scheduled_at.

## Solution Summary

Add quiz_sessions and quiz_items, quiz_responses tables (or extend schema from spec). Implement “Start quiz” flow: select up to 10 random facts for the user; if 0 facts, return/display “Add some facts first” and do not start. For each fact, create a quiz item (snapshot question + canonical answer), show question, collect plain-text answer, call AI service to grade, store response (llm_grade, confidence, rationale; no final_grade override yet). Session mode = manual_random. Do not update facts.srs_level or facts.next_scheduled_at. UI: “Start quiz” button, quiz flow (question → text input → submit → show result → next), completion view.

## Mergability Strategy

### Feature Flagging Strategy

Optional: `ENABLE_MANUAL_QUIZ` to gate the feature. For v1 can ship without flag.

### Patch Ordering Strategy

**Early**: Schema for quiz_sessions, quiz_items, quiz_responses; API types and stubs; test stubs.  
**Middle**: Implement start manual quiz (select facts, create session/items), submit answer (grade via AI, store response), get session state.  
**Late**: UI — Start quiz, quiz flow, completion.

## Current State Analysis

- **After M3**: Facts exist; user can add/edit/delete; AI service has gradeAnswer. No quiz schema or flow.
- **Spec**: quiz_sessions (id, user_id, mode manual_random|scheduled, created_at, finished_at); quiz_items (quiz_session_id, fact_id, generated_question_text, canonical_answer_snapshot); quiz_responses (quiz_item_id, response_text, llm_grade, final_grade, llm_confidence, corrected_by_user, created_at). For M4, final_grade = llm_grade and corrected_by_user = false.

## Required Changes

### 1. Database

- quiz_sessions, quiz_items, quiz_responses tables per Recall_v1_spec §5.2. Mode enum includes `manual_random`.

### 2. API (oRPC or equivalent)

- `quiz.startManual`: () => if user has 0 facts return error or empty; else select up to 10 random facts; create quiz_session (mode manual_random), create quiz_items with question/canonical snapshot; return session id and items (question text, quiz_item id).
- `quiz.getSession`: (sessionId) => return session + items + responses so far (for resume/display).
- `quiz.submitAnswer`: (sessionId, quizItemId, responseText) => call AIService.gradeAnswer; insert quiz_response (response_text, llm_grade, final_grade = llm_grade, llm_confidence, corrected_by_user = false); return grade + confidence + rationale; do not update fact SRS.
- `quiz.finishSession`: (sessionId) => set finished_at. Optional: can be done on last submit.

### 3. Authorization

- All quiz procedures scoped to current user; session and facts belong to user.

### 4. UI

- “Start quiz” on facts page or dedicated quiz page: if 0 facts show “Add some facts first”; else start quiz.
- Quiz view: show one question at a time; text input for answer; Submit → show grade/feedback (and rationale if desired); Next → next question. After last item, show completion (e.g. “Quiz complete”) and optionally summary (X of Y correct).

## Acceptance Criteria

- [ ] User can start a manual quiz (“Start quiz”).
- [ ] System selects up to 10 random facts (or all if fewer than 10); 0 facts → show “Add some facts first”, no quiz.
- [ ] For each fact: show question, user types answer, LLM grades (grade + confidence + rationale); quiz session, items, and responses stored.
- [ ] Correct/incorrect does not change SRS (no updates to facts.srs_level or next_scheduled_at).

## Open Questions

- Show rationale to user after each answer or only in summary? (Spec says LLM outputs rationale; UX choice.)
- Resume incomplete session (e.g. refresh mid-quiz) — in scope or leave for polish?

## Explicit Opinions

- Plain text answers: deeper learning than multiple choice.
- Manual quizzes never affect SRS: practice without changing due dates.
- Grade override comes in M6; here final_grade = llm_grade.

## Patches

### Patch 1 [INFRA]: Quiz schema and migrations

**Files to create/modify:**
- `server/db/schema.ts`: quiz_sessions, quiz_items, quiz_responses; mode enum
- Migration file

**Changes:**
1. Add tables per spec; run migration.

### Patch 2 [INFRA]: Quiz API types and stubs

**Files to create/modify:**
- Quiz router types: startManual, getSession, submitAnswer, finishSession
- Zod schemas; procedure stubs or “not implemented” returns

**Changes:**
1. Define input/output types; optional stub implementations.

### Patch 3 [INFRA]: Test stubs for manual quiz

**Files to create:**
- `server/quiz/quiz.test.ts` or similar

**Changes:**
1. Stubs with .skip: startManual with 0 facts fails or returns empty; startManual with facts creates session and items; submitAnswer grades and stores response and does not update fact SRS.

### Patch 4 [BEHAVIOR]: Implement startManual and getSession

**Files to modify:**
- Quiz router

**Changes:**
1. startManual: check fact count; if 0 return error or structured “no facts”; else select up to 10 random facts, create session (manual_random), create items with snapshots; return session id and items.
2. getSession: load session + items + responses for user.
3. Unskip start/get tests.

### Patch 5 [BEHAVIOR]: Implement submitAnswer and finishSession

**Files to modify:**
- Quiz router; wire AIService

**Changes:**
1. submitAnswer: load session/item, call AIService.gradeAnswer(userAnswer, canonicalAnswer); insert quiz_response; do not update fact; return grade + confidence + rationale.
2. finishSession: set finished_at (or infer on last item).
3. Unskip submit tests.

### Patch 6 [BEHAVIOR]: Manual quiz UI

**Files to create:**
- Quiz entry: “Start quiz” button; 0 facts → “Add some facts first”; else call startManual and navigate to quiz view.
- Quiz view: one question at a time; text input; Submit → show result; Next → next item; on last item complete and show completion/summary.

**Changes:**
1. Wire startManual, getSession, submitAnswer from UI; handle loading and errors.

## Test Map

| Test Name | File | Stub Patch | Impl Patch |
|-----------|------|------------|------------|
| startManual > returns error or empty when 0 facts | server/quiz/quiz.test.ts | 3 | 4 |
| startManual > creates session and items for up to 10 random facts | server/quiz/quiz.test.ts | 3 | 4 |
| submitAnswer > stores response and does not update fact SRS | server/quiz/quiz.test.ts | 3 | 5 |

## Dependency Graph

```
- Patch 1 [INFRA] -> []
- Patch 2 [INFRA] -> [1]
- Patch 3 [INFRA] -> [2]
- Patch 4 [BEHAVIOR] -> [2, 3]
- Patch 5 [BEHAVIOR] -> [2, 3, 4]
- Patch 6 [BEHAVIOR] -> [4, 5]
```

**Mergability insight**: 3 of 6 patches INFRA; behavior is start/get, submit/finish, then UI.

## Mergability Checklist

- [ ] Feature flag strategy documented (optional).
- [ ] Early patches schema and types only.
- [ ] Test stubs in Patch 3; impl in 4 and 5.
- [ ] Test Map complete.
- [ ] BEHAVIOR patches justified (API and UI for DoD).
