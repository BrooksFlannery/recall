# Gameplan: facts-list-add-edit-delete

## Workstream

**Workstream**: Recall v1  
**Milestone**: 3 — facts-list-add-edit-delete  
**Prior milestones**: 1 (effect-ts-migration), 2 (auth-and-user-signup)  
**Unlocks**: Manual quiz (M4) and scheduled quiz (M5)

## Problem Statement

Users need to build and maintain a single list of facts. Each fact is one block of user text; the system must generate a question and canonical answer via the AI service, store them with the fact, and support editing (with optional SRS reset) and hard delete. The list must be flat, newest first, with no notebooks or categories.

## Solution Summary

Add `facts` table and oRPC (or existing API) procedures for list, create, update, delete. List returns facts for the current user ordered by `created_at` desc. Create: accept user content, call AI service to generate question + canonical answer, store fact with type `generic`, SRS level 0, and set `next_scheduled_at`. Edit: accept new user content and “keep schedule” flag; regenerate Q/A via AI; if “keep schedule” is off, reset SRS. Delete: hard delete fact. UI: facts list page, “Add Fact” button opening a modal (text input + submit), edit modal with user content + “Keep schedule” switch + Save, delete with confirmation.

## Mergability Strategy

### Feature Flagging Strategy

Optional: `ENABLE_FACTS_CRUD` to gate list/add/edit/delete until ready — can skip for v1 and ship behavior directly.

### Patch Ordering Strategy

**Early**: Facts schema and migrations; oRPC procedures (or API) stubs/types; test stubs.  
**Middle**: Implement create (with AI service), update, delete, list; wire AI Layer in call path.  
**Late**: UI — list page, Add Fact modal, edit modal, delete confirmation.

## Current State Analysis

- **After M2**: Auth in place; user session available; no facts schema or API.
- **After M1**: AI service (Effect) exists; need to call it from fact create/edit.
- **API**: tRPC may exist; workstream says oRPC + React Query. This gameplan can assume oRPC procedures for facts (list, create, update, delete) or be written to be API-agnostic; prefer oRPC if migration is done, else document “facts API” and implement with oRPC when available.

## Required Changes

### 1. Database

- **facts** table: id, user_id, type (enum generic|definition|relationship|procedure|list), user_content (text), generated_question (text), canonical_answer (text), srs_level (int), next_scheduled_at (timestamp), last_reviewed_at (nullable), created_at, updated_at. Default type `generic`.

### 2. API (oRPC)

- `facts.list`: () => facts for current user, order by created_at desc.
- `facts.create`: (input: { user_content: string }) => validate, call AIService.generateQuestionAnswer, insert fact with type generic, srs_level 0, next_scheduled_at = now + 1 day (or per spec).
- `facts.update`: (input: { id, user_content, keep_schedule: boolean }) => if !keep_schedule reset SRS; call AIService.generateQuestionAnswer; update user_content, generated_question, canonical_answer (and SRS fields if reset).
- `facts.delete`: (input: { id }) => hard delete fact for current user.

### 3. Authorization

- All procedures scoped to current user (session); filter by user_id on all queries.

### 4. UI

- Facts list page (e.g. `/app/facts`): table or list of facts (e.g. user_content preview or generated_question), newest first; “Add Fact” button; per-row Edit and Delete.
- Add Fact modal: multiline text input, Submit; on submit call create, close modal, refresh list.
- Edit modal: prefill user_content; “Keep schedule” switch; Save; on save call update, close modal, refresh list.
- Delete: confirm dialog then delete.

## Acceptance Criteria

- [ ] User sees a flat list of facts (newest first).
- [ ] User can add a fact via “Add Fact” → modal with text input + submit; LLM generates question + canonical answer; fact stored with type `generic`.
- [ ] User can edit a fact’s user content with “Keep schedule” switch + Save; LLM regenerates Q/A; Save respects switch (keep SRS vs reset SRS).
- [ ] User can hard-delete a fact.
- [ ] All operations are user-scoped and require auth.

## Open Questions

- oRPC migration: do before this gameplan or as part of it? (Workstream has oRPC in tech stack; if tRPC still present, either migrate in M2/M3 or implement facts on tRPC and migrate later.)
- Exact SRS initial state: next_scheduled_at = now + 1 day vs now + Fibonacci[0] (spec says level 0 → 1 day).

## Explicit Opinions

- Single flat list: no notebooks/pages/categories in v1.
- Keep schedule switch + single Save: one clear edit action, explicit control over SRS reset.
- Hard delete only: no soft delete in v1.
- Fact type defaults to `generic`; other types stored but not assigned yet.

## Patches

### Patch 1 [INFRA]: Facts schema and migration

**Files to create/modify:**
- `server/db/schema.ts`: facts table with all fields; fact type enum
- Migration file

**Changes:**
1. Add facts table and enum; run migration.

### Patch 2 [INFRA]: Facts API types and procedure signatures (oRPC)

**Files to create/modify:**
- oRPC router or equivalent: facts.list, facts.create, facts.update, facts.delete input/output types
- Zod schemas for input validation

**Changes:**
1. Define input/output types and schemas; export procedure signatures (implementation can be stub that throws “not implemented” or return empty list).

### Patch 3 [INFRA]: Test stubs for facts procedures

**Files to create:**
- `server/facts/facts.test.ts` or similar

**Changes:**
1. Stubs with .skip: list returns newest first; create calls AI and persists; update respects keep_schedule; delete removes fact.

### Patch 4 [BEHAVIOR]: Implement facts.list and facts.delete

**Files to modify:**
- Facts router implementation

**Changes:**
1. list: query facts by session user_id, order by created_at desc.
2. delete: delete fact where id and user_id match.
3. Unskip list/delete tests.

### Patch 5 [BEHAVIOR]: Implement facts.create with AI

**Files to modify:**
- Facts router; wire AIService Layer in app/server context

**Changes:**
1. create: get session user; call AIService.generateQuestionAnswer(user_content); insert fact with user_id, user_content, generated question/answer, type generic, srs_level 0, next_scheduled_at.
2. Unskip create test.

### Patch 6 [BEHAVIOR]: Implement facts.update with AI and keep_schedule

**Files to modify:**
- Facts router

**Changes:**
1. update: load fact for user; if !keep_schedule set srs_level 0, next_scheduled_at = now + 1 day (or Fibonacci[0]); call AIService.generateQuestionAnswer; update user_content, generated_question, canonical_answer, and SRS fields.
2. Unskip update test.

### Patch 7 [BEHAVIOR]: Facts list page and Add Fact modal

**Files to create:**
- `app/app/facts/page.tsx`: list of facts, Add Fact button
- `components/AddFactModal.tsx`: text area, submit; call facts.create, invalidate list, close

**Changes:**
1. List page uses React Query (or equivalent) to fetch facts.list; display newest first; “Add Fact” opens modal.
2. Modal submit calls create; loading and error states.

### Patch 8 [BEHAVIOR]: Edit and Delete UI

**Files to create/modify:**
- `components/EditFactModal.tsx`: user_content, Keep schedule switch, Save
- Delete: button + confirm dialog; call facts.delete, invalidate list

**Changes:**
1. Edit modal: load fact, prefill; on Save call facts.update with keep_schedule; refresh list.
2. Delete: confirm then delete; refresh list.

## Test Map

| Test Name | File | Stub Patch | Impl Patch |
|-----------|------|------------|------------|
| facts.list > returns facts for user newest first | server/facts/facts.test.ts | 3 | 4 |
| facts.delete > removes fact for user | server/facts/facts.test.ts | 3 | 4 |
| facts.create > calls AI and stores fact with generic type | server/facts/facts.test.ts | 3 | 5 |
| facts.update > updates content and Q/A; resets SRS when keep_schedule false | server/facts/facts.test.ts | 3 | 6 |

## Dependency Graph

```
- Patch 1 [INFRA] -> []
- Patch 2 [INFRA] -> [1]
- Patch 3 [INFRA] -> [2]
- Patch 4 [BEHAVIOR] -> [2, 3]
- Patch 5 [BEHAVIOR] -> [2, 3, 4]
- Patch 6 [BEHAVIOR] -> [2, 3, 4]
- Patch 7 [BEHAVIOR] -> [4, 5]
- Patch 8 [BEHAVIOR] -> [4, 6]
```

**Mergability insight**: 3 of 8 patches are INFRA; behavior patches are small (list/delete, create, update, then UI).

## Mergability Checklist

- [ ] Feature flag strategy documented (optional; can omit).
- [ ] Early patches schema and types only.
- [ ] Test stubs in Patch 3; implementations in 4, 5, 6.
- [ ] Test Map complete.
- [ ] BEHAVIOR patches justified (API and UI required for DoD).
