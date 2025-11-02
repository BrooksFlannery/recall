# Recall Data Model

This document provides a comprehensive overview of the Recall application's database schema and relationships. The database uses Drizzle ORM with PostgreSQL.

## Naming Conventions

- **Table names**: Plural snake_case (e.g., `notes`, `notebooks`, `note_categories`)
- **Column names**: snake_case (e.g., `created_at`, `user_id`)
- **Primary keys**: `id` as `uuid` default `gen_random_uuid()` (except `users.id` which is `text` managed by BetterAuth)
- **Timestamps**: `created_at` and `updated_at` (`timestamptz`), server-updated
- **Foreign keys**: `*_id` columns with `ON DELETE CASCADE` where owned
- **Ownership**: `user_id` on user-owned rows; row-level access enforced in app layer

## Entity Relationship Diagram

```mermaid
erDiagram
    users ||--o{ notebooks : "owns"
    users ||--o{ notes : "owns"
    users ||--o{ categories : "owns"
    users ||--o{ quizzes : "owns"
    users ||--o{ answers : "owns"
    
    notebooks ||--o{ notes : "contains"
    notebooks ||--o{ categories : "contains"
    notebooks ||--o{ quizzes : "scoped to"
    
    notes ||--o{ questions : "generates"
    notes ||--o{ note_categories : "tagged with"
    notes ||--o{ answers : "referenced in"
    
    categories ||--o{ note_categories : "applied to"
    
    quizzes ||--o{ answers : "contains"
    
    questions ||--o{ answers : "answered in"
    
    users {
        text id PK
        text email UK
        boolean email_verified
        text name
        text image
        timestamptz created_at
        timestamptz updated_at
    }
    
    notebooks {
        uuid id PK
        uuid user_id FK
        text name
        text description
        timestamptz created_at
        timestamptz updated_at
    }
    
    notes {
        uuid id PK
        uuid user_id FK
        uuid notebook_id FK
        text text
        timestamptz created_at
        timestamptz updated_at
    }
    
    categories {
        uuid id PK
        uuid user_id FK
        uuid notebook_id FK
        text name UK
        timestamptz created_at
        timestamptz updated_at
    }
    
    note_categories {
        uuid note_id PK_FK
        uuid category_id PK_FK
    }
    
    questions {
        uuid id PK
        uuid note_id FK
        text question_text
        numeric difficulty
        timestamptz last_asked_at
        timestamptz created_at
        timestamptz updated_at
    }
    
    quizzes {
        uuid id PK
        uuid user_id FK
        uuid notebook_id FK
        timestamptz created_at
        timestamptz finished_at
        numeric score
        jsonb analysis
    }
    
    answers {
        uuid id PK
        uuid quiz_id FK
        uuid note_id FK
        uuid question_id FK
        uuid user_id FK
        boolean correct
        numeric confidence
        numeric difficulty
        timestamptz created_at
    }
```

## Data Flow Diagram

```mermaid
flowchart TD
    A[User] -->|creates| B[Notebook]
    A -->|creates| C[Note]
    B -->|contains| C
    B -->|has| D[Category]
    C -->|can be tagged with| D
    C -->|generates| E[Question]
    A -->|starts| F[Quiz]
    B -->|scopes| F
    F -->|contains| G[Answer]
    E -->|answered in| G
    C -->|referenced in| G
    
    style A fill:#e1f5ff
    style B fill:#fff4e1
    style C fill:#f0fff0
    style D fill:#ffe1f5
    style E fill:#f5f0ff
    style F fill:#fff0f0
    style G fill:#f0f0ff
```

## Relationship Details

### Core Ownership
- **Users → Notebooks**: One-to-many. Each user can create multiple notebooks.
- **Users → Notes**: One-to-many. Each user owns their notes.
- **Users → Categories**: One-to-many. Each user owns their categories.
- **Users → Questions**: One-to-many (via notes). Questions inherit ownership through their parent note.
- **Users → Quizzes**: One-to-many. Each user creates their own quizzes.
- **Users → Answers**: One-to-many. Each user records their own answers.

### Notebook Organization
- **Notebooks → Notes**: One-to-many. Each notebook contains multiple notes.
- **Notebooks → Categories**: One-to-many. Each notebook can have multiple categories.
- **Notebooks → Quizzes**: One-to-many. Each quiz is scoped to a specific notebook.

### Note Categorization
- **Notes ↔ Categories**: Many-to-many via `note_categories` join table.
  - A note can belong to zero or more categories.
  - A category can contain zero or more notes.
  - Both note and category must belong to the same notebook.

### Quiz System
- **Notes → Questions**: One-to-many. Each note can generate multiple questions over time.
- **Quizzes → Answers**: One-to-many. Each quiz contains multiple answers.
- **Questions → Answers**: One-to-many. Each question can be answered multiple times across different quizzes.
- **Notes → Answers**: One-to-many. A note can be referenced in multiple answers (via questions).

## Field Descriptions

### users
- **id** (TEXT, PK): Unique identifier, managed by BetterAuth (uses text IDs)
- **email** (TEXT, UNIQUE): User's email address
- **email_verified** (BOOLEAN): Email verification status
- **name** (TEXT): User's display name (optional)
- **image** (TEXT): Profile image URL (optional)
- **created_at** (TIMESTAMPTZ): Account creation timestamp
- **updated_at** (TIMESTAMPTZ): Last update timestamp

### notebooks
- **id** (UUID, PK): Unique identifier
- **user_id** (UUID, FK): Owner of the notebook
- **name** (TEXT): Notebook name
- **description** (TEXT): Optional description
- **created_at** (TIMESTAMPTZ): Creation timestamp
- **updated_at** (TIMESTAMPTZ): Last update timestamp

### notes
- **id** (UUID, PK): Unique identifier
- **user_id** (UUID, FK): Owner of the note
- **notebook_id** (UUID, FK): Parent notebook
- **text** (TEXT): Note content
- **created_at** (TIMESTAMPTZ): Creation timestamp
- **updated_at** (TIMESTAMPTZ): Last update timestamp

### categories
- **id** (UUID, PK): Unique identifier
- **user_id** (UUID, FK): Owner of the category
- **notebook_id** (UUID, FK): Parent notebook
- **name** (TEXT): Category name (unique within notebook)
- **created_at** (TIMESTAMPTZ): Creation timestamp
- **updated_at** (TIMESTAMPTZ): Last update timestamp

### note_categories
- **note_id** (UUID, PK/FK): References notes.id
- **category_id** (UUID, PK/FK): References categories.id
- Composite primary key ensures no duplicate associations

### questions
- **id** (UUID, PK): Unique identifier
- **note_id** (UUID, FK): Source note (ownership derived via note.user_id)
- Note: Questions inherit ownership through their parent note, so no direct `user_id` column is needed
- **question_text** (TEXT): The question text
- **difficulty** (NUMERIC 0-1): Question difficulty rating
- **last_asked_at** (TIMESTAMPTZ): Last time this question was asked (optional)
- **created_at** (TIMESTAMPTZ): Creation timestamp
- **updated_at** (TIMESTAMPTZ): Last update timestamp

### quizzes
- **id** (UUID, PK): Unique identifier
- **user_id** (UUID, FK): Quiz creator
- **notebook_id** (UUID, FK): Scope of the quiz
- **created_at** (TIMESTAMPTZ): Quiz start timestamp
- **finished_at** (TIMESTAMPTZ): Quiz completion timestamp (null if unfinished)
- **score** (NUMERIC): Final quiz score
- **analysis** (JSONB): Detailed quiz analysis and insights

### answers
- **id** (UUID, PK): Unique identifier
- **quiz_id** (UUID, FK): Parent quiz
- **note_id** (UUID, FK): Referenced note
- **question_id** (UUID, FK): Specific question answered
- **user_id** (UUID, FK): User who answered
- **correct** (BOOLEAN): Whether the answer was correct
- **confidence** (NUMERIC 0-1): User's confidence rating (optional)
- **difficulty** (NUMERIC 0-1): Question difficulty at time of answer (optional)
- **created_at** (TIMESTAMPTZ): Answer timestamp

## Key Constraints

### Uniqueness
- `users.email`: Unique email addresses
- `categories(notebook_id, name)`: Unique category names per notebook

### Cascades
All foreign keys use `ON DELETE CASCADE`:
- Deleting a user removes all their notebooks, notes, categories, questions, quizzes, and answers
- Deleting a notebook removes all its notes, categories, and quizzes
- Deleting a note removes associated questions, note_categories, and answers
- Deleting a category removes note_categories associations
- Deleting a quiz removes all its answers
- Deleting a question removes associated answers

### Indexes

Performance indexes for common query patterns:

- `notes(user_id, created_at desc)` - Fast user note listing
- `notes(notebook_id, created_at desc)` - Fast notebook note listing
- `notebooks(user_id, created_at desc)` - Fast user notebook listing
- `categories(notebook_id)` - Fast category lookup by notebook
- `categories(notebook_id, lower(name))` - Unique category name per notebook
- `quizzes(user_id, created_at desc)` - Fast user quiz listing
- `quizzes(notebook_id, created_at desc)` - Fast notebook quiz listing
- `quizzes(notebook_id, finished_at nulls first, created_at desc)` - Active quiz lookup
- `answers(quiz_id)` - Fast answer lookup by quiz
- `answers(user_id, created_at desc)` - Fast user answer history
- `answers(question_id, created_at desc)` - Fast question answer history
- `note_categories(category_id)` - Fast note lookup by category
- `note_categories(note_id)` - Fast category lookup by note

## Common Query Patterns

1. **Get user's notebooks**: `notebooks WHERE user_id = ? ORDER BY created_at DESC`
2. **Get notebook's notes**: `notes WHERE notebook_id = ? ORDER BY created_at DESC`
3. **Get note's categories**: Join `note_categories` and `categories` on `category_id`
4. **Get active quiz**: `quizzes WHERE notebook_id = ? AND finished_at IS NULL`
5. **Get quiz answers**: `answers WHERE quiz_id = ?`
6. **Get question history**: `answers WHERE question_id = ? ORDER BY created_at DESC`

## Export Instructions

To export an ERD diagram from the database:

1. Use Drizzle Studio: `pnpm db:studio`
2. Use a database visualization tool like pgAdmin or TablePlus
3. Use a schema visualization tool like dbdiagram.io or draw.io with the Mermaid diagram above

