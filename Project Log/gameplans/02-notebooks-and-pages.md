# Gameplan: notebooks-and-pages

## Problem Statement

Users need to write and organize markdown notes. We need notebooks (containers), pages (markdown docs), auto-save, and link parsing.

## Solution Summary

Build CRUD for notebooks and pages. Pages have auto-save (debounced 3s), slug-based routing, and internal link parsing. Simple textarea editor.

## Current State Analysis

Auth is complete (Gameplan 01). Users can sign in. Now we need content authoring.

## Required Changes

### Database Schema
```ts
export const notebooks = pgTable('notebooks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const pages = pgTable('pages', {
  id: uuid('id').primaryKey().defaultRandom(),
  notebookId: uuid('notebook_id').notNull().references(() => notebooks.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  bodyMd: text('body_md').notNull().default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  uniqueSlug: unique().on(table.notebookId, table.slug),
}))

export const pageLinks = pgTable('page_links', {
  fromPageId: uuid('from_page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  toPageId: uuid('to_page_id').references(() => pages.id, { onDelete: 'set null' }),
  toSlug: text('to_slug').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.fromPageId, table.toSlug] }),
}))
```

### Key Functions
```ts
// Slug generation with collision handling
export async function generateUniqueSlug(title: string, notebookId: string): Promise<string>

// Parse markdown links: [text](slug)
export function parseMarkdownLinks(markdown: string): Array<{ text: string; slug: string }>

// Auto-save hook
export function useAutoSave<T>(value: T, onSave: (value: T) => Promise<void>, delay: number)
```

## Acceptance Criteria

- [ ] User can create/edit/delete notebooks
- [ ] User can create/edit/delete pages
- [ ] Page editor auto-saves after 3s of inactivity
- [ ] Slug generation handles collisions (appends `-1`, `-2`, etc.)
- [ ] Internal links are parsed and stored in page_links
- [ ] No data loss on navigation

## Explicit Opinions

1. **Auto-save over explicit save button**: Modern UX
2. **Slug-based routing**: Clean URLs (e.g., `/app/notebooks/xyz/pages/intro`)
3. **Markdown-only**: No WYSIWYG in v1
4. **Simple textarea**: No CodeMirror/Monaco complexity
5. **Broken link tolerance**: Store slug even if target doesn't exist

## Patches

### Patch 1: Database schema and API routes

**Files to create:**
- `src/db/schema.ts` (add notebooks, pages, page_links)
- `src/db/migrations/0002_create_notebooks_and_pages.sql`
- `src/lib/slugify.ts` (slug generation)
- `src/lib/linkParser.ts` (markdown link parsing)
- `src/app/api/notebooks/route.ts` (POST, GET)
- `src/app/api/notebooks/[id]/route.ts` (PATCH, DELETE)
- `src/app/api/notebooks/[notebookId]/pages/route.ts` (POST, GET)
- `src/app/api/notebooks/[notebookId]/pages/[slug]/route.ts` (GET, PATCH, DELETE)

**Changes:**
1. Create tables with unique constraints
2. Implement slug generation with collision handling
3. Implement link parser (regex-based)
4. Build CRUD API routes for notebooks and pages
5. Parse links on page save, populate page_links table

**Tests:**
- Slug generation handles collisions
- Link parser extracts internal links, ignores external
- API routes create/update/delete records correctly
- Page save populates page_links

---

### Patch 2: Notebook UI

**Files to create:**
- `src/components/NotebookSelector.tsx`
- `src/app/app/notebooks/page.tsx` (notebook list)
- `src/app/app/notebooks/[notebookId]/layout.tsx` (notebook layout)

**Changes:**
1. Dropdown to switch between notebooks
2. Notebook list view with create button
3. Layout includes notebook selector

**Tests:**
- Notebook selector displays all user notebooks
- Can create new notebook
- Switching notebooks works

---

### Patch 3: Page editor with auto-save

**Files to create:**
- `src/hooks/useAutoSave.ts`
- `src/components/PageEditor.tsx`
- `src/app/app/notebooks/[notebookId]/pages/[slug]/page.tsx`

**Changes:**
1. Implement debounced auto-save hook (3s delay)
2. Textarea editor with title input
3. Save indicator ("Saving..." vs "Saved at 2:30 PM")
4. Editor calls auto-save hook on changes

**Tests:**
- Auto-save debounces correctly (waits 3s)
- Save indicator shows correct state
- No data loss on rapid edits
- E2E: Create page, edit content, navigate away, return → content persisted

---

### Patch 4: Page list sidebar

**Files to create:**
- `src/components/PageListSidebar.tsx`

**Changes:**
1. List all pages in current notebook
2. Show page titles with updated_at timestamps
3. Highlight active page
4. "New Page" button creates page with title "Untitled"

**Tests:**
- Page list updates when pages are created/deleted
- Active page is highlighted
- New Page button creates page

---

## Dependency Graph

```
- Patch 1 -> []
- Patch 2 -> [1]
- Patch 3 -> [1]
- Patch 4 -> [1, 3]
```

**4 patches total** - Patches 2 and 3 can run in parallel after Patch 1. Estimated ~2-3 days.
