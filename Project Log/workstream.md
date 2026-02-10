# Workstream: Recall v1

## Vision

Recall helps users commit knowledge to long-term memory by turning personal notes (markdown pages) into atomic facts that are reviewed via spaced repetition. Users write markdown notes, facts are automatically extracted via LLM, and a Fibonacci-based SRS ensures optimal review timing. v1 delivers a complete end-to-end experience: write → extract → review.

## Current State

Empty repository. Starting from scratch with Next.js, PostgreSQL (Neon), and Drizzle ORM.

## Key Challenges

- **LLM fact extraction accuracy**: Quality of extracted facts determines learning effectiveness
- **Fact stability across page edits**: Preserve SRS state when pages change (v2 problem - defer incremental extraction)
- **SRS scheduling correctness**: Fibonacci ladder must be implemented precisely
- **Quiz grading reliability**: LLM must accurately evaluate user answers

## Milestones

### Milestone 1: auth-and-user-signup

**Definition of Done**:
- User can sign in with Google OAuth
- User session persists across browser refreshes
- Protected routes redirect unauthenticated users to login
- User profile page displays basic user info

**Why this is a safe pause point**: Authentication layer is complete. All subsequent features can assume user context exists.

**Unlocks**: Building user-scoped features (notebooks, pages, facts, quizzes).

**Explicit Opinions**:
- Database sessions over JWT: Better security, easier revocation
- Google OAuth only: Reduces complexity
- No password auth: Not needed for v1

**Out of Scope**: Password auth, magic links, account deletion, email verification

**Success Metrics**: User can sign in and see protected app

---

### Milestone 2: notebooks-and-pages

**Definition of Done**:
- User can create/edit/delete notebooks and pages
- Page editor auto-saves
- Internal links are parsed and stored

**Why this is a safe pause point**: Content authoring layer is complete. Users can write notes.

**Unlocks**: Page content to feed into fact extraction (Milestone 3).

**Explicit Opinions**:
- Auto-save over explicit save button: Modern UX
- Markdown-only (no WYSIWYG): Scope control
- Simple textarea: No CodeMirror complexity

**Out of Scope**: WYSIWYG, page history, markdown preview, search, tags

**Success Metrics**: User can create and edit pages without data loss

---

### Milestone 3: basic-fact-extraction

**Definition of Done**:
- Facts are automatically extracted when page is saved
- Extraction runs in background
- Facts are displayed in a list view for the page

**Why this is a safe pause point**: Core AI layer is complete. Users can see auto-generated facts.

**Unlocks**: Fact inventory for quiz system (Milestone 4).

**Explicit Opinions**:
- Full extraction only (no incremental updates in v1): Simpler, good enough
- Extraction on save: Automatic workflow
- Background processing: Don't block UI
- No approval queue: Trust LLM, users can delete bad facts

**Out of Scope**: Incremental extraction (diff-based updates), manual fact authoring, fact editing, cross-page deduplication

**Success Metrics**: Extraction completes within 30s for typical page

---

### Milestone 4: quiz-system

**Definition of Done**:
- User can start a scheduled quiz (facts due today)
- User can start a manual quiz (select page or random)
- LLM grades answers with user override option
- Quiz results are stored

**Why this is a safe pause point**: Users can review facts.

**Unlocks**: Review workflow. Prepares for SRS scheduling (Milestone 5).

**Explicit Opinions**:
- Plain text answers (no multiple choice): Deeper learning
- LLM grading with override: Balance automation + control
- Manual quizzes don't affect SRS: Allows practice

**Out of Scope**: Voice input, cloze deletion, image occlusion, social features

**Success Metrics**: Quiz completes without errors, LLM grading >85% accurate

---

### Milestone 5: srs-scheduling

**Definition of Done**:
- Scheduled quizzes update fact.srs_level based on final grade
- Dashboard shows facts due today + 7-day forecast
- Fibonacci ladder implemented correctly

**Why this is a safe pause point**: SRS is fully functional. Complete learning system.

**Unlocks**: v1 completion.

**Explicit Opinions**:
- Fibonacci ladder (fixed): Simple, well-tested
- Any non-correct grade resets to level 0: Strict but ensures mastery
- Manual quizzes never affect SRS: Preserves integrity

**Out of Scope**: Adaptive difficulty, custom algorithms, ease factor, lapse tracking

**Success Metrics**: Scheduling math is correct, users sustain daily review habit

---

### Milestone 6: polish-and-deploy

**Definition of Done**:
- Error handling for all LLM failures
- Loading states for all async operations
- Deployed to Vercel with monitoring

**Why this is a safe pause point**: Product is deployed and usable.

**Unlocks**: Alpha testing with real users.

**Out of Scope**: Mobile app, offline support, API, export/import, collaboration

**Success Metrics**: Zero critical bugs, <5s p95 load time, >90% uptime

---

## Dependency Graph

```
1 (Auth) → []
2 (Notebooks & Pages) → [1]
3 (Basic Fact Extraction) → [2]
4 (Quiz System) → [3]
5 (SRS Scheduling) → [4]
6 (Polish & Deploy) → [5]
```

**Linear dependencies**: Each milestone builds on the previous.

---

## Open Questions

| Question | Notes | Resolve By |
|----------|-------|------------|
| Background job infrastructure | Vercel async queue vs. pg-boss | Milestone 3 |
| Incremental extraction | Defer to v2 or build in v1.5? | After Milestone 3 |
| SRS reset policy | Should partially_correct reset to 0 or -1 level? | Milestone 5 |

---

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Next.js App Router | Modern, server-first, great DX |
| PostgreSQL (Neon) | Relational data, strong consistency |
| Drizzle ORM | Type-safe, SQL-first |
| Google OAuth only | 90% of users have Google accounts |
| Database sessions over JWT | Better security, simpler |
| Markdown-only | Appeals to technical users, scope control |
| Auto-save pages | Modern UX |
| Auto-extract facts | Automatic workflow |
| Full extraction only (v1) | Simpler than incremental, good enough |
| Soft-delete facts | Preserve SRS history |
| LLM grading with override | Balances automation + control |
| Deploy on Vercel | Zero-config, scales automatically |
