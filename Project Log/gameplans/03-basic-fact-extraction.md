# Gameplan: basic-fact-extraction

## Problem Statement

Users need facts to be automatically extracted from pages. Manually creating flashcards is tedious. We need LLM-powered extraction that runs in the background without blocking the UI.

## Solution Summary

On page save, trigger background job to extract facts via OpenAI GPT-4. Store facts with source attribution (line range, quote). Display facts in a list view. **No incremental extraction in v1** - just full re-extraction on every save (simpler, good enough for v1).

## Current State Analysis

Notebooks and pages are complete (Gameplan 02). Users can write markdown. Now we need to analyze that content and extract facts.

## Required Changes

### Database Schema
```ts
export const facts = pgTable('facts', {
  id: uuid('id').primaryKey().defaultRandom(),
  pageId: uuid('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  type: text('type').notNull().$type<'generic' | 'definition' | 'relationship' | 'procedure' | 'list'>(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  srsLevel: integer('srs_level').notNull().default(0),
  nextScheduledAt: timestamp('next_scheduled_at').notNull().defaultNow(),
  lastReviewedAt: timestamp('last_reviewed_at'),
  sourceStartLine: integer('source_start_line').notNull(),
  sourceEndLine: integer('source_end_line').notNull(),
  sourceQuote: text('source_quote').notNull(),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const factExtractionJobs = pgTable('fact_extraction_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  pageId: uuid('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  status: text('status').notNull().$type<'pending' | 'running' | 'completed' | 'failed'>(),
  extractedFactCount: integer('extracted_fact_count'),
  errorMessage: text('error_message'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

### LLM Client
```ts
export interface ExtractedFact {
  question: string
  answer: string
  type: 'generic' | 'definition' | 'relationship' | 'procedure' | 'list'
  sourceStartLine: number
  sourceEndLine: number
  sourceQuote: string
}

export async function extractFacts(markdown: string): Promise<ExtractedFact[]> {
  // Use OpenAI GPT-4 with structured output
  // System prompt: Extract atomic facts for spaced repetition
  // Return JSON array of facts
}
```

### Background Job
```ts
export async function extractFactsJob(pageId: string) {
  // 1. Soft-delete all existing facts for this page
  // 2. Extract new facts from page.bodyMd
  // 3. Insert new facts
  // 4. Update job status
}
```

## Acceptance Criteria

- [ ] Facts are automatically extracted when page is saved
- [ ] Extraction runs in background (doesn't block UI)
- [ ] Facts are displayed in a list view for the page
- [ ] User sees extraction progress indicator
- [ ] Extraction completes within 30s for typical page

## Explicit Opinions

1. **Full extraction only (v1)**: No incremental extraction, no diff, no fact matching. Just re-extract everything on each save. Simpler, good enough for v1.
2. **Soft-delete old facts**: Mark as deleted instead of hard delete. Preserves history.
3. **Extraction on save**: Automatic workflow, no manual trigger.
4. **Background processing**: Don't block UI (may take 10-30s).
5. **No approval queue**: Trust LLM, users can delete bad facts manually.

## Patches

### Patch 1: Schema, LLM client, and background job infrastructure

**Files to create:**
- `src/db/schema.ts` (add facts, fact_extraction_jobs)
- `src/db/migrations/0003_create_facts.sql`
- `src/lib/llm/client.ts` (OpenAI client wrapper)
- `src/lib/llm/prompts.ts` (extraction prompt)
- `src/jobs/queue.ts` (job queue setup - Vercel async queue or pg-boss)
- `src/jobs/extractFacts.ts` (extraction job handler)

**Changes:**
1. Create facts and jobs tables
2. Set up OpenAI client with structured output
3. Write extraction prompt (quality > quantity)
4. Implement background job queue
5. Implement extraction job:
   - Soft-delete existing facts (set deletedAt)
   - Call LLM to extract facts
   - Insert new facts
   - Mark job as completed/failed

**Tests:**
- LLM client returns structured facts (mock OpenAI API)
- Extraction job soft-deletes old facts
- Extraction job inserts new facts
- Job handles errors gracefully

---

### Patch 2: Wire up extraction trigger on page save

**Files to modify:**
- `src/app/api/notebooks/[notebookId]/pages/[slug]/route.ts` (PATCH handler)

**Files to create:**
- `src/app/api/pages/[pageId]/extract-facts/route.ts` (manual trigger endpoint for testing)

**Changes:**
1. After page update, enqueue extraction job
2. Return immediately (don't wait for job)
3. Add manual trigger endpoint for testing

**Tests:**
- Page save enqueues extraction job
- Manual trigger endpoint works
- Multiple saves don't create duplicate jobs (debounce or check pending jobs)

---

### Patch 3: Facts list UI with extraction status

**Files to create:**
- `src/app/app/notebooks/[notebookId]/pages/[slug]/facts/page.tsx`
- `src/components/FactsList.tsx`
- `src/components/ExtractionStatus.tsx`

**Changes:**
1. Facts list page (show question, answer, type, SRS level)
2. Extraction status indicator:
   - Poll for job status on page
   - Show "Extracting facts..." if job is running
   - Show "Extraction complete" when done
3. Delete button (soft delete)

**Tests:**
- Facts list displays all non-deleted facts for page
- Extraction status shows correct state
- Delete button soft-deletes fact
- E2E: Create page with content, see extraction happen, facts appear

---

## Dependency Graph

```
- Patch 1 -> []
- Patch 2 -> [1]
- Patch 3 -> [1, 2]
```

**3 patches total** - Linear dependencies. Estimated ~2-3 days.

---

## Notes for v2

**Deferred to v2:**
- Incremental extraction (diff-based updates)
- Fact matching via embeddings to preserve SRS state across page edits
- Fact validation after edits

**Why deferred**: These add significant complexity (diff library, embeddings API, matching logic). For v1, full re-extraction on every save is simpler and good enough. Users won't have huge pages, and extraction is fast enough (<30s).
