# Gameplan: grade-override

## Workstream

**Workstream**: Recall v1  
**Milestone**: 6 — grade-override  
**Prior milestones**: 1–5 (Effect-TS, auth, facts, manual quiz, scheduled quiz + SRS)  
**Unlocks**: Polish and deploy (M7)

## Problem Statement

LLM grading can be wrong. Users need to correct the grade per quiz item after a quiz is complete. The final grade (user-corrected when provided) should drive SRS for scheduled quizzes and analytics for both manual and scheduled.

## Solution Summary

Add “override grade” after quiz completion: for each quiz item with a response, allow the user to set a final grade (override). Store in quiz_responses: final_grade and corrected_by_user = true. Ensure SRS for scheduled quizzes uses final_grade. Expose API to set override per response; UI: on quiz completion (or “Review results” view), show each item with LLM grade and option to change to correct/incorrect (or full grade enum); save overrides. If M5 applies SRS at submit time for scheduled, either (a) move SRS application to session finish so user can override first, or (b) when user overrides after the fact, recompute that fact’s SRS from the overridden grade (e.g. revert fact to pre-quiz state and re-apply with new grade). Workstream opinion: “Override after completion: simpler than per-item override mid-quiz; still corrects before SRS apply for scheduled” — so prefer (a) where SRS is applied only after user has had a chance to override (e.g. on “Finish” / “Done reviewing”).

## Mergability Strategy

### Feature Flagging Strategy

Optional: `ENABLE_GRADE_OVERRIDE`. Can ship without for v1.

### Patch Ordering Strategy

**Early**: API type for setGradeOverride; ensure quiz_responses.final_grade and corrected_by_user are used consistently; test stubs.  
**Middle**: Implement setGradeOverride; ensure SRS for scheduled uses final_grade (refactor SRS application to session finish for scheduled if needed).  
**Late**: UI to override per item after quiz (results screen).

## Current State Analysis

- **After M5**: quiz_responses has llm_grade, final_grade, corrected_by_user. M4/M5 set final_grade = llm_grade and corrected_by_user = false. SRS for scheduled is applied (likely at submitAnswer). No override API or UI.

## Required Changes

### 1. API

- `quiz.setGradeOverride`: (input: { quizResponseId, final_grade }) => validate response belongs to user’s session; update quiz_responses.final_grade and corrected_by_user = true.
- **SRS timing**: For scheduled quizzes, SRS must use final_grade. If M5 applies SRS in submitAnswer, refactor so that for scheduled sessions, SRS is applied when the session is finished (e.g. finishSession or “Done reviewing”), after the user has had a chance to override. Then apply SRS for all items using each response’s final_grade.

### 2. UI

- After quiz completion: show results (question, user answer, LLM grade, rationale). Per item: control to set override (e.g. dropdown or correct/incorrect toggle). Save overrides via setGradeOverride. For scheduled, “Done reviewing” (or equivalent) triggers SRS application and marks session finished.

### 3. Authorization

- setGradeOverride: response must belong to a session owned by the current user.

## Acceptance Criteria

- [ ] After any quiz (manual or scheduled), user can override the LLM grade per item.
- [ ] Final grade used for SRS (scheduled only) and analytics is the user-corrected grade when provided.
- [ ] Override persists (final_grade, corrected_by_user = true).
- [ ] Scheduled SRS uses overridden grade when set (either by applying SRS at session finish after override opportunity, or by correcting fact SRS when user overrides).

## Open Questions

- **SRS application timing**: Apply SRS for scheduled at submitAnswer (current M5) and add “correction” path when user overrides later, vs. apply SRS only at session finish after user can override. Workstream prefers “corrects before SRS apply” → apply at session finish. Resolve in this gameplan and document in M5 if M5 needs a small refactor.

## Explicit Opinions

- Override after completion: simpler than per-item override mid-quiz; still corrects before SRS apply for scheduled (per workstream).

## Patches

### Patch 1 [INFRA]: setGradeOverride API type and validation

**Files to create/modify:**
- Quiz router types: setGradeOverride input (quizResponseId, final_grade); Zod schema
- Ensure grade enum matches (incorrect | incomplete | partially_correct | correct)

**Changes:**
1. Add procedure signature and schema; optional stub that returns “not implemented”.

### Patch 2 [INFRA]: Test stubs for override and SRS with final_grade

**Files to create/modify:**
- `server/quiz/quiz.test.ts`: setGradeOverride updates response; scheduled SRS uses final_grade after override

**Changes:**
1. Stubs with .skip: setGradeOverride persists; for scheduled session, SRS reflects overridden grade (or SRS applied at finish uses final_grade).

### Patch 3 [BEHAVIOR]: Refactor SRS application for scheduled (if needed)

**Files to modify:**
- Quiz router; SRS apply helper

**Changes:**
1. If M5 applies SRS in submitAnswer for scheduled: move that logic to finishSession (or completeScheduledSession). When finishing a scheduled session, apply SRS for all items using each response’s final_grade. submitAnswer for scheduled only stores the response and does not update fact.
2. If M5 already defers SRS to finish: ensure finish uses final_grade; no change.
3. Unskip tests that assert SRS uses final_grade.

### Patch 4 [BEHAVIOR]: Implement setGradeOverride

**Files to modify:**
- Quiz router

**Changes:**
1. setGradeOverride: load response and session; verify session belongs to user; update quiz_responses.final_grade and corrected_by_user = true. If session is scheduled and SRS was already applied (e.g. we didn’t refactor to finish-only), optionally trigger SRS correction for that one fact (complex); else no change to facts (SRS applied at finish uses updated final_grade).
2. Unskip setGradeOverride tests.

### Patch 5 [BEHAVIOR]: Override UI after quiz

**Files to create/modify:**
- Quiz results view: list items with question, answer, LLM grade, rationale; per item override control (e.g. dropdown); Save or per-item save; for scheduled, “Done reviewing” button that calls finishSession (applying SRS) and navigates away.

**Changes:**
1. Wire setGradeOverride from UI; show success; for scheduled, wire finishSession so user can override then click Done to apply SRS and finish.

## Test Map

| Test Name | File | Stub Patch | Impl Patch |
|-----------|------|------------|------------|
| setGradeOverride > updates final_grade and corrected_by_user | server/quiz/quiz.test.ts | 2 | 4 |
| scheduled SRS > uses final_grade (after override or at finish) | server/quiz/quiz.test.ts or server/srs/srs.test.ts | 2 | 3 or 4 |

## Dependency Graph

```
- Patch 1 [INFRA] -> []
- Patch 2 [INFRA] -> [1]
- Patch 3 [BEHAVIOR] -> [2]
- Patch 4 [BEHAVIOR] -> [1, 2]
- Patch 5 [BEHAVIOR] -> [4, 3]
```

**Mergability insight**: 2 of 5 patches INFRA; behavior is SRS refactor (if needed), override API, then UI.

## Mergability Checklist

- [ ] Feature flag strategy documented (optional).
- [ ] Early patches types and stubs only.
- [ ] Test stubs in Patch 2; impl in 3 and 4.
- [ ] Test Map complete.
- [ ] BEHAVIOR patches justified (SRS timing, override API, UI).
