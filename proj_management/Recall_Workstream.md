# Workstream: Recall v1

## Vision

Recall helps users commit knowledge to long-term memory by entering facts and reviewing them via spaced repetition. Users add a piece of information (free text); the AI generates questions and answers for quizzing. A Fibonacci-based SRS drives when facts are due. v1 delivers: add facts → get quizzed (manual or scheduled) → SRS updates from scheduled quizzes only.

## Current State

Empty repository. Starting from scratch with Next.js, PostgreSQL (Neon), and Drizzle ORM.

## Key Challenges

- **LLM Q/A generation quality**: Generated question and canonical answer must support effective quizzing
- **Quiz grading reliability**: LLM must accurately evaluate user answers
- **SRS scheduling correctness**: Fibonacci ladder and “only scheduled quizzes affect SRS” must be implemented precisely

## Milestones

### Milestone 1: effect-ts-migration

**Definition of Done**:
- Custom FP utilities (`lib/utils/fp.ts`, `lib/utils/zod.ts`, `lib/utils/fp-examples.ts`) removed and replaced with Effect-TS
- Effect used for Option, Either, Effect, pipe; Zod kept for schemas with an Effect-friendly bridge where needed
- AI usage defined as an Effect service (Context + Tag + Layer): interface for Q/A generation and answer grading so the implementation can be swapped (e.g. OpenAI now, other providers later)
- No custom Biome/Grit rules for the old FP patterns (already removed); Effect-era lint rules can be added later if desired

**Why this is a safe pause point**: FP and DI foundation is in place. All feature work can assume Effect and the AI service abstraction.

**Unlocks**: Auth and all subsequent milestones build on Effect + swappable AI.

**Explicit Opinions**:
- Effect-TS over custom Option/Either: One standard library, DI (Context/Tag/Layer) built in
- AI as an Effect service: Swappable provider, testable with mocks

**Out of Scope**: New Effect-specific linter rules, migrating to Effect Schema (Zod stays for v1)

**Success Metrics**: Project uses Effect for FP and DI; AI service interface exists with at least one implementation (e.g. OpenAI); existing FP-related Grit plugins removed

---

### Milestone 2: auth-and-user-signup

**Definition of Done**:
- User can sign in with Google OAuth
- User can sign in with email/password
- User session persists across browser refreshes
- Protected routes redirect unauthenticated users to login
- User profile page displays basic user info

**Why this is a safe pause point**: Authentication layer is complete. All subsequent features can assume user context exists.

**Unlocks**: User-scoped facts and quizzes.

**Explicit Opinions**:
- Database sessions over JWT: Better security, easier revocation
- Google OAuth + email/password: Flexibility for users who prefer either

**Out of Scope**: Magic links, account deletion, email verification flows

**Success Metrics**: User can sign in (Google or email/password) and see protected app

---

### Milestone 3: facts-list-add-edit-delete

**Definition of Done**:
- User sees a flat list of facts (newest first)
- User can add a fact via “Add Fact” → modal with text input + submit; LLM generates question + canonical answer; fact is stored with type `generic`
- User can edit a fact’s user content; “Keep schedule” switch + Save; LLM regenerates Q/A; Save respects switch (keep SRS vs reset SRS)
- User can hard-delete a fact

**Why this is a safe pause point**: Core content model is complete. Users can build a fact list.

**Unlocks**: Quiz system (manual and scheduled).

**Explicit Opinions**:
- Single flat list: No notebooks/pages/categories in v1
- Keep schedule switch + single Save: One clear edit action, explicit control over SRS reset
- Hard delete only: No soft delete in v1
- Fact type defaults to `generic`; other types stored but not assigned yet

**Out of Scope**: Tags, folders, filtering, fact type assignment

**Success Metrics**: User can add, edit, and delete facts; Q/A generation completes on create/edit

---

### Milestone 4: manual-quiz

**Definition of Done**:
- User can start a manual quiz (“Start quiz”)
- System selects up to 10 random facts (or all if fewer than 10); 0 facts → show “Add some facts first”, no quiz
- For each fact: show question, user types answer, LLM grades (grade + confidence + rationale)
- Quiz session, items, and responses are stored
- Correct/incorrect does **not** change SRS

**Why this is a safe pause point**: Users can practice without affecting schedule.

**Unlocks**: Scheduled quiz (same grading flow, different fact selection and SRS effect).

**Explicit Opinions**:
- Plain text answers: Deeper learning than multiple choice
- Manual quizzes never affect SRS: Practice without changing due dates

**Out of Scope**: Grade override (comes after both quiz types), voice input, cloze deletion

**Success Metrics**: Manual quiz completes without errors; responses stored; SRS unchanged

---

### Milestone 5: scheduled-quiz-and-srs

**Definition of Done**:
- User can start a scheduled quiz (facts where `next_scheduled_at <= now`)
- Same answer/grading flow as manual quiz; results stored
- After final grade: SRS updated per spec (correct → level up, non-correct → reset to 0; `next_scheduled_at` = now + Fibonacci[srs_level])
- Dashboard or minimal “due today” view (e.g. count of facts due)

**Why this is a safe pause point**: SRS is fully functional. Complete learning loop.

**Unlocks**: Grade override and polish.

**Explicit Opinions**:
- Only scheduled quizzes affect SRS: Manual stays practice-only
- Fibonacci ladder (fixed): Simple, well-tested
- Any non-correct grade resets to level 0: Strict but ensures mastery

**Out of Scope**: Adaptive difficulty, custom algorithms, 7-day forecast (optional; can add in polish)

**Success Metrics**: Scheduling math is correct; scheduled quiz updates fact SRS fields; users can sustain daily review

---

### Milestone 6: grade-override

**Definition of Done**:
- After any quiz (manual or scheduled), user can override the LLM grade per item
- Final grade used for SRS (scheduled only) and analytics is the user-corrected grade when provided

**Why this is a safe pause point**: Users can fix misgrades. SRS reflects human judgment.

**Unlocks**: Polish and deploy.

**Explicit Opinions**:
- Override after completion: Simpler than per-item override mid-quiz; still corrects before SRS apply for scheduled

**Out of Scope**: Per-question override during quiz, bulk override UI

**Success Metrics**: Override persists; scheduled SRS uses overridden grade when set

---

### Milestone 7: polish-and-deploy

**Definition of Done**:
- Error handling for LLM failures (Q/A generation, grading)
- Loading states for all async operations
- Deployed to Vercel with monitoring

**Why this is a safe pause point**: Product is deployed and usable.

**Unlocks**: Alpha testing with real users.

**Out of Scope**: Mobile app, offline support, API, export/import, collaboration

**Success Metrics**: Zero critical bugs, <5s p95 load time, >90% uptime

---

## Dependency Graph

```
1 (Effect-TS migration) → []
2 (Auth) → [1]
3 (Facts: list, add, edit, delete) → [2]
4 (Manual quiz) → [3]
5 (Scheduled quiz + SRS) → [3]
6 (Grade override) → [4, 5]
7 (Polish & Deploy) → [6]
```

**Notes**: 4 and 5 both depend only on 3; they can be built in either order. 6 depends on both quiz types being done.

---

## Open Questions

| Question | Notes | Resolve By |
|----------|-------|------------|
| SRS reset policy | Should `partially_correct` reset to 0 or -1 level? | Milestone 5 |
| Due-today UX | Minimal count vs 7-day forecast in v1 | Milestone 5 / 7 |

---

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Effect-TS | FP (Option, Either, Effect, pipe) + DI (Context, Tag, Layer); replace custom fp.ts |
| AI as Effect service | Interface for Q/A generation + grading; swappable implementation (OpenAI first) |
| Next.js App Router | Modern, server-first, great DX |
| PostgreSQL (Neon) | Relational data, strong consistency |
| Drizzle ORM | Type-safe, SQL-first |
| oRPC + React Query | Type-safe API layer; replace tRPC with oRPC |
| Better Auth | Google OAuth + email/password |
| OpenAI GPT-4o-mini | Cost-effective LLM for Q/A generation and grading |
| shadcn/ui (standard only) | Default theme and components; no custom/experimental UI |
| Bun test runner, unit only | No E2E/UI testing in v1 |
| Bun | Runtime and package manager |
| Google OAuth + email/password | Flexibility; many users have Google, others prefer email |
| Database sessions over JWT | Better security, simpler revocation |
| User-entered facts only (no notebooks/pages) | Simplicity; single flat list |
| LLM generates Q/A from user content | No manual Q/A entry; one text block per fact |
| Keep schedule switch + Save on edit | Single edit action; explicit SRS reset control |
| Hard delete only | No soft delete in v1 |
| Manual quiz: no SRS effect | Practice without changing schedule |
| Only scheduled quizzes affect SRS | Clear mental model |
| Grade override after both quiz types | Implement once, applies to both |
| Fact type default `generic`; types unused in v1 | Schema ready for future use |
| Deploy on Vercel | Zero-config, scales automatically |
