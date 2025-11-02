import {
  boolean,
  index,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

// Users table (managed by BetterAuth)
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  name: text('name'),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Session table (for BetterAuth)
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
});

// Account table (for OAuth providers - BetterAuth)
export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', {
    withTimezone: true,
  }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
    withTimezone: true,
  }),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

// Verification table (for email verification - BetterAuth)
export const verifications = pgTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Notebooks table
export const notebooks = pgTable(
  'notebooks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdCreatedAtIdx: index('notebooks_user_id_created_at_idx').on(
      table.userId,
      table.createdAt,
    ),
  }),
);

// Categories table
export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    notebookId: uuid('notebook_id')
      .notNull()
      .references(() => notebooks.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    notebookIdIdx: index('categories_notebook_id_idx').on(table.notebookId),
    notebookNameUniqueIdx: unique('categories_notebook_name_unique_idx').on(
      table.notebookId,
      table.name,
    ),
  }),
);

// Notes table
export const notes = pgTable(
  'notes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    notebookId: uuid('notebook_id')
      .notNull()
      .references(() => notebooks.id, { onDelete: 'cascade' }),
    text: text('text').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdCreatedAtIdx: index('notes_user_id_created_at_idx').on(
      table.userId,
      table.createdAt,
    ),
    notebookIdCreatedAtIdx: index('notes_notebook_id_created_at_idx').on(
      table.notebookId,
      table.createdAt,
    ),
  }),
);

// Note-Categories many-to-many join table
export const noteCategories = pgTable(
  'note_categories',
  {
    noteId: uuid('note_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.noteId, table.categoryId] }),
    noteIdIdx: index('note_categories_note_id_idx').on(table.noteId),
    categoryIdIdx: index('note_categories_category_id_idx').on(
      table.categoryId,
    ),
  }),
);

// Questions table
export const questions = pgTable(
  'questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    noteId: uuid('note_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
    questionText: text('question_text').notNull(),
    difficulty: numeric('difficulty', { precision: 3, scale: 2 }), // 0-1 range
    lastAskedAt: timestamp('last_asked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    noteIdIdx: index('questions_note_id_idx').on(table.noteId),
  }),
);

// Quizzes table
export const quizzes = pgTable(
  'quizzes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    notebookId: uuid('notebook_id')
      .notNull()
      .references(() => notebooks.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    score: numeric('score', { precision: 5, scale: 2 }),
    analysis: jsonb('analysis'),
  },
  (table) => ({
    userIdCreatedAtIdx: index('quizzes_user_id_created_at_idx').on(
      table.userId,
      table.createdAt,
    ),
    notebookIdCreatedAtIdx: index('quizzes_notebook_id_created_at_idx').on(
      table.notebookId,
      table.createdAt,
    ),
    notebookIdFinishedAtIdx: index(
      'quizzes_notebook_id_finished_at_idx',
    ).on(table.notebookId, table.finishedAt, table.createdAt),
  }),
);

// Answers table
export const answers = pgTable(
  'answers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    quizId: uuid('quiz_id')
      .notNull()
      .references(() => quizzes.id, { onDelete: 'cascade' }),
    noteId: uuid('note_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    correct: boolean('correct').notNull(),
    confidence: numeric('confidence', { precision: 3, scale: 2 }), // 0-1 range
    difficulty: numeric('difficulty', { precision: 3, scale: 2 }), // 0-1 range
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    quizIdIdx: index('answers_quiz_id_idx').on(table.quizId),
    userIdCreatedAtIdx: index('answers_user_id_created_at_idx').on(
      table.userId,
      table.createdAt,
    ),
    questionIdCreatedAtIdx: index('answers_question_id_created_at_idx').on(
      table.questionId,
      table.createdAt,
    ),
  }),
);

// Export full schema for Drizzle (includes all tables)
export const schema = {
  users,
  sessions,
  accounts,
  verifications,
  notebooks,
  categories,
  notes,
  noteCategories,
  questions,
  quizzes,
  answers,
};

// Export schema subset for Better Auth
// Note: With usePlural: true, Better Auth expects plural keys matching table names
export const betterAuthSchema = {
  users,
  sessions,
  accounts,
  verifications,
};


