# Gameplan: facts-list-add-edit-delete

## Workstream

**Workstream**: Recall v1  
**Milestone**: 3 — facts-list-add-edit-delete  
**Prior milestones**: 1 (effect-ts-migration), 2 (auth-and-user-signup)  
**Unlocks**: Manual quiz (M4) and scheduled quiz (M5)

## Problem Statement

Users need to build and maintain a single list of facts. Each fact is one block of user text; the system must generate a question and canonical answer via the AI service, store them in a `fact_items` record linked to the fact, and support editing (with optional SRS reset) and hard delete. The list must be flat, newest first, with no notebooks or categories.

## Solution Summary

Add `facts` and `fact_items` tables and oRPC procedures for list, create, update, delete. Migrate from tRPC to oRPC as the first infra step in this gameplan. List returns facts for the current user ordered by `created_at` desc, each joined with its latest `fact_item`. Create: accept user content, call AI service to generate question + canonical answer, insert fact and a `fact_items` row with the result. Edit: accept new user content and “keep schedule” flag; regenerate Q/A via AI; insert a new `fact_items` row (preserving history); if “keep schedule” is off, reset SRS on the fact. Delete: hard delete fact (cascades to `fact_items`). UI: facts list page, “Add Fact” button opening a modal (text input + submit), edit modal with user content + “Keep schedule” switch + Save, delete with confirmation.

## Mergability Strategy

### Feature Flagging Strategy

Optional: `ENABLE_FACTS_CRUD` to gate list/add/edit/delete until ready — can skip for v1 and ship behavior directly.

### Patch Ordering Strategy

**Early**: Migrate to oRPC; facts schema and migrations; oRPC procedure stubs/types; test stubs.  
**Middle**: Implement create (with AI service), update, delete, list; wire AI Layer in call path.  
**Late**: UI — list page, Add Fact modal, edit modal, delete confirmation.

## Current State Analysis

- **After M2**: Auth in place; user session available; no facts schema or API.
- **After M1**: AI service (Effect) exists; need to call it from fact create/edit.
- **API**: tRPC exists today. This gameplan migrates to oRPC first, then implements facts procedures on oRPC with React Query on the client.

## Required Changes

### 1. Database

- **facts** table: id, user_id, type (enum; currently only `generic` — future values TBD), user_content (text), srs_level (int), next_scheduled_at (timestamp), created_at, updated_at. Default type `generic`.
- **fact_items** table: id, fact_id (FK → facts, cascade delete), question (text), canonical_answer (text), created_at. Each row is one AI-generated Q/A pair. A new row is inserted on every create or edit; the current item is always the latest by `created_at`. Future quiz-event fields (e.g. user_answer, is_correct, reviewed_at) will be added here.

### 2. API (oRPC)

- Procedure context includes session (e.g. from BetterAuth) so all procedures can scope by `user_id`.
- `facts.list`: () => facts for current user, order by created_at desc; each fact joined with its latest fact_item (by created_at).
- `facts.create`: (input: { user_content: string }) => validate, call AIService.generateQuestionAnswer, insert fact (type generic, srs_level 0, next_scheduled_at = now + 1 day) and a fact_items row with the generated question + canonical_answer.
- `facts.update`: (input: { id, user_content, keep_schedule: boolean }) => update fact's user_content; if !keep_schedule reset SRS (srs_level 0, next_scheduled_at = now + 1 day); call AIService.generateQuestionAnswer; insert a new fact_items row (preserves Q/A history).
- `facts.delete`: (input: { id }) => hard delete fact for current user (cascades to fact_items).

### 3. Authorization

- All procedures scoped to current user (session); filter by user_id on all queries.

### 4. UI

- Facts list page (e.g. `/app/facts`): table or list of facts (e.g. user_content preview or latest fact_item's question), newest first; “Add Fact” button; per-row Edit and Delete.
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

- (None; previously open items resolved in Explicit Opinions.)

## Explicit Opinions

- **Migrate to oRPC in this gameplan**: Replace tRPC with oRPC as the first infra step; implement all facts procedures on oRPC. Do not implement facts on tRPC.
- **SRS initial state**: For new facts and for reset-on-edit, use `next_scheduled_at = now + 1 day` (level 0 → 1 day).
- Single flat list: no notebooks/pages/categories in v1.
- Keep schedule switch + single Save: one clear edit action, explicit control over SRS reset.
- Hard delete only: no soft delete in v1.
- Fact type defaults to `generic`; other types stored but not assigned yet.

## Patches

### Patch 1 [INFRA]: Migrate from tRPC to oRPC

**Files to create/modify:**
- oRPC server router setup (replacing or alongside `server/trpc/`)
- oRPC client and React Query integration (replacing `lib/trpc/`)
- API route for oRPC (e.g. `app/api/[...orpc]/route.ts` or equivalent)
- Layout/provider: use oRPC client and QueryClient for app routes
- Procedure context: include session (e.g. from BetterAuth) so procedures can read `user.id`

**Changes:**
1. Install oRPC deps; create server router, client, and API route.
2. Build procedure context with session (auth) for user-scoped procedures.
3. Replace tRPC provider with oRPC + React Query in app layout; remove or deprecate tRPC usage for app routes.

### Patch 2 [INFRA]: Facts schema and migration

**Files to create/modify:**
- `server/db/schema.ts`: facts and fact_items tables; fact type enum
- Migration file

**Changes:**
1. Add facts and fact_items tables and enum; run migration.

### Patch 3 [INFRA]: Facts API types and procedure signatures (oRPC)

**Files to create/modify:**
- oRPC router: facts.list, facts.create, facts.update, facts.delete input/output types
- Zod schemas for input validation

**Changes:**
1. Define input/output types and schemas; export procedure signatures (implementation can be stub that throws “not implemented” or return empty list).

### Patch 4 [INFRA]: Test stubs for facts procedures

**Files to create:**
- `server/facts/facts.test.ts` or similar

**Changes:**
1. Stubs with .skip: list returns newest first; create calls AI and persists; update respects keep_schedule; delete removes fact.

### Patch 5 [BEHAVIOR]: Implement facts.list and facts.delete

**Files to modify:**
- Facts router implementation

**Changes:**
1. list: query facts by session user_id, order by created_at desc.
2. delete: delete fact where id and user_id match.
3. Unskip list/delete tests.

### Patch 6 [BEHAVIOR]: Implement facts.create with AI

**Files to modify:**
- Facts router; wire AIService Layer in app/server context

**Changes:**
1. create: get session user; call AIService.generateQuestionAnswer(user_content); insert fact (user_id, user_content, type generic, srs_level 0, next_scheduled_at) and a fact_items row (fact_id, question, canonical_answer).
2. Unskip create test.

### Patch 6 [BEHAVIOR]: Implement facts.update with AI and keep_schedule

**Files to modify:**
- Facts router

**Changes:**
1. update: load fact for user; update user_content; if !keep_schedule set srs_level 0, next_scheduled_at = now + 1 day; run AIService.generateQuestionAnswer; insert new fact_items row (preserves Q/A history).
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
| facts.list > returns facts for user newest first | server/facts/facts.test.ts | 4 | 5 |
| facts.delete > removes fact for user | server/facts/facts.test.ts | 4 | 5 |
| facts.create > calls AI and stores fact with generic type | server/facts/facts.test.ts | 4 | 6 |
| facts.update > updates content and Q/A; resets SRS when keep_schedule false | server/facts/facts.test.ts | 4 | 7 |

## Dependency Graph

```
- Patch 1 [INFRA] -> []
- Patch 2 [INFRA] -> [1]
- Patch 3 [INFRA] -> [2]
- Patch 4 [INFRA] -> [3]
- Patch 5 [BEHAVIOR] -> [3, 4]
- Patch 6 [BEHAVIOR] -> [3, 4, 5]
- Patch 7 [BEHAVIOR] -> [3, 4, 5]
- Patch 8 [BEHAVIOR] -> [5, 6]
- Patch 9 [BEHAVIOR] -> [5, 7]
```

**Mergability insight**: 4 of 9 patches are INFRA (oRPC migration, schema, types, test stubs); behavior patches are small (list/delete, create, update, then UI).

## Mergability Checklist

- [ ] Feature flag strategy documented (optional; can omit).
- [ ] Early patches: oRPC migration, then schema and types.
- [ ] Test stubs in Patch 4; implementations in 5, 6, 7.
- [ ] Test Map complete.
- [ ] BEHAVIOR patches justified (API and UI required for DoD).
