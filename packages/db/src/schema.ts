import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

// Runtime key/value settings (feature flags, maintenance mode, etc.).
export const appSettings = pgTable('app_settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Task engine (docs/ARCHITECTURE.md §4/§13 S2), trimmed to what the
 * current stage needs. Full auth (S3) doesn't exist yet, so `users`
 * here is intentionally minimal: just enough to give `attempts`/
 * `mistakes` a stable owner. Rows are created lazily for a
 * client-generated anonymous id (see apps/api's anon-user plugin) —
 * this is not an auth system, it's the FK target auth will attach to
 * later (`auth_identities` etc.), added when S3 actually lands.
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
});

// Matches apps/web's data/subjects.ts ids (math, russian, ...) so seed
// content and the existing frontend subject list stay in sync.
export const subjects = pgTable('subjects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
});

export const topics = pgTable(
  'topics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    subjectId: text('subject_id')
      .notNull()
      .references(() => subjects.id),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
  },
  (table) => [uniqueIndex('topics_subject_slug_idx').on(table.subjectId, table.slug)],
);

/**
 * 'interval' and 'multi_part' reuse the existing `correctAnswer`
 * column: for 'interval' it's still a plain interval-set string (see
 * @zybrilka/shared's intervalAnswer.ts); for 'multi_part' it's JSON
 * (see multiPartAnswer.ts). No separate columns per type.
 */
export const taskAnswerTypes = [
  'short_answer',
  'multiple_choice',
  'interval',
  'multi_part',
] as const;
/**
 * 'needs_review' (S3 import pipeline): parsed/solved but not safe to show a
 * real student yet — a mismatched/uncertain answer, an unsupported answer
 * shape (e.g. multi-part a/b/v), or an explanation that failed its own
 * validation pass. Never served by the public API alongside 'published'.
 */
export const taskStatuses = ['draft', 'published', 'archived', 'needs_review'] as const;

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    subjectId: text('subject_id')
      .notNull()
      .references(() => subjects.id),
    /** The official EGE question number within the subject (1, 2, 3…). */
    taskNumber: integer('task_number').notNull(),
    topicId: uuid('topic_id').references(() => topics.id),
    /** 1 = лёгкое, 2 = среднее, 3 = сложное. */
    difficulty: integer('difficulty').notNull(),
    conditionMd: text('condition_md').notNull(),
    imageUrl: text('image_url'),
    answerType: text('answer_type', { enum: taskAnswerTypes }).notNull().default('short_answer'),
    /** Never sent to the client before an attempt exists for it — see modules/tasks/service.ts. */
    correctAnswer: text('correct_answer').notNull(),
    /**
     * Optional presentation-only version of `correctAnswer` — LaTeX
     * ($...$) for a value whose plain form isn't real math typography
     * (e.g. "arccos(√10/5)", an interval-set string). Never read by
     * checkAnswer/checkIntervalAnswer/gradeMultiPart — those always
     * grade against `correctAnswer` itself, so this column can never
     * change what counts as a correct answer (EGE Fidelity: Final
     * Polish audit, Block 2 — machine value vs display value). Null
     * means `correctAnswer` is already fine to show as-is (most tasks
     * — a plain number needs no separate display form).
     */
    correctAnswerDisplay: text('correct_answer_display'),
    answerOptions: jsonb('answer_options').$type<readonly string[] | null>(),
    explanationMd: text('explanation_md').notNull(),
    /**
     * A short, task-specific nudge shown before an attempt exists (same
     * visibility as `conditionMd`, never the answer) — points at the
     * right method (ОДЗ, a theorem, what to read off a graph) without
     * giving away the solution. Null for tasks that don't have one yet
     * (never a generic fallback — see apps/web's toSampleTask).
     */
    hintMd: text('hint_md'),
    /**
     * The same content as `explanationMd`, broken into named steps for
     * a step-by-step UI — titles are per-task ("ОДЗ", "Считываем данные
     * с графика", "Теорема Пифагора", ...), never a fixed template.
     * Only sent alongside `explanationMd` (post-attempt). Null falls
     * back to rendering `explanationMd` as one block.
     */
    solutionSteps: jsonb('solution_steps').$type<
      readonly { title: string; explanation: string }[] | null
    >(),
    source: text('source').notNull(),
    sourceUrl: text('source_url'),
    sourceYear: integer('source_year'),
    /**
     * S3 import provenance (docs/imports/ege-2026-variant-1-manifest.json)
     * — which document/variant/page a task was transcribed from, kept
     * separately from `source` (a short display label like "ФИПИ" or a
     * publisher name) so audits can trace a task back to its exact page.
     * Null for hand-seeded/demo tasks that predate the import pipeline.
     */
    sourceDocument: text('source_document'),
    sourceVariant: integer('source_variant'),
    sourcePage: integer('source_page'),
    /**
     * The condition exactly as transcribed from the source before any
     * normalization/LaTeX cleanup — kept so a reviewer can always compare
     * `conditionMd` back against what the document actually said.
     */
    rawStatement: text('raw_statement'),
    /** Dedup fingerprint: hash(subjectId + taskNumber + normalized statement). */
    contentHash: text('content_hash'),
    tags: jsonb('tags').$type<readonly string[]>().notNull().default([]),
    status: text('status', { enum: taskStatuses }).notNull().default('draft'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('tasks_subject_number_idx').on(table.subjectId, table.taskNumber),
    index('tasks_status_idx').on(table.status),
    uniqueIndex('tasks_content_hash_idx').on(table.contentHash),
  ],
);

/**
 * S3.2 content model (docs/PRODUCTION_DATA_MODEL.md): a `Task` stays a
 * single row owned by `subjects`/`topics` as before; `collections` and
 * `variants` are a separate membership layer on top via `variantTasks`
 * — a task never gets duplicated to appear in a collection/variant, a
 * full exam variant, and the "по заданиям" number filter at once.
 * `draft`/`archived` mirror `tasks.status` but there is no
 * `needs_review` here — review happens per-task, not per-collection.
 */
export const contentStatuses = ['draft', 'published', 'archived'] as const;

export const collections = pgTable(
  'collections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    subjectId: text('subject_id')
      .notNull()
      .references(() => subjects.id),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    /** Display label for the publisher/author, e.g. "Ященко". Never baked into a Task row directly. */
    publisher: text('publisher'),
    year: integer('year'),
    description: text('description'),
    status: text('status', { enum: contentStatuses }).notNull().default('published'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('collections_slug_idx').on(table.slug)],
);

export const variants = pgTable(
  'variants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    collectionId: uuid('collection_id')
      .notNull()
      .references(() => collections.id),
    variantNumber: integer('variant_number').notNull(),
    title: text('title').notNull(),
    year: integer('year'),
    status: text('status', { enum: contentStatuses }).notNull().default('published'),
    sourceFile: text('source_file'),
    sourcePageStart: integer('source_page_start'),
    sourcePageEnd: integer('source_page_end'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('variants_collection_number_idx').on(table.collectionId, table.variantNumber),
  ],
);

/**
 * Task <-> Variant membership, many-to-many in shape even though today
 * every task belongs to exactly one variant: the same Task row (found
 * by dedup fingerprint, `tasks.contentHash`) can later gain a second
 * `variantTasks` row for a different variant without ever being
 * copied. `position` is the task's 1-based order within that variant's
 * full exam (never touched by shuffle — see modules/tasks). Listing
 * "every task in a collection" joins this table to `variants` and
 * filters by `collectionId`, rather than adding a separate
 * `collection_tasks` table that would just duplicate this membership.
 */
export const variantTasks = pgTable(
  'variant_tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    variantId: uuid('variant_id')
      .notNull()
      .references(() => variants.id),
    taskId: uuid('task_id')
      .notNull()
      .references(() => tasks.id),
    position: integer('position').notNull(),
  },
  (table) => [
    uniqueIndex('variant_tasks_variant_task_idx').on(table.variantId, table.taskId),
    index('variant_tasks_variant_position_idx').on(table.variantId, table.position),
    index('variant_tasks_task_idx').on(table.taskId),
  ],
);

export const attempts = pgTable(
  'attempts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    taskId: uuid('task_id')
      .notNull()
      .references(() => tasks.id),
    answerRaw: text('answer_raw').notNull(),
    isCorrect: boolean('is_correct').notNull(),
    timeSpentMs: integer('time_spent_ms'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('attempts_user_task_idx').on(table.userId, table.taskId),
    index('attempts_task_idx').on(table.taskId),
  ],
);

export const mistakeStatuses = ['open', 'resolved'] as const;

/**
 * One row per (user, task) ever answered wrong — never deleted, only
 * updated. `timesWrong` and `firstAttemptId` are the permanent history;
 * `status` flips to 'resolved' on a later correct attempt and back to
 * 'open' if the user gets it wrong again, per CLAUDE.md's "Мои ошибки"
 * spec (a real training mode, not just a log).
 */
export const mistakes = pgTable(
  'mistakes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    taskId: uuid('task_id')
      .notNull()
      .references(() => tasks.id),
    firstAttemptId: uuid('first_attempt_id')
      .notNull()
      .references(() => attempts.id),
    lastAttemptId: uuid('last_attempt_id')
      .notNull()
      .references(() => attempts.id),
    timesWrong: integer('times_wrong').notNull().default(1),
    status: text('status', { enum: mistakeStatuses }).notNull().default('open'),
    /**
     * For 'multi_part' tasks only: ids of the parts that were wrong on
     * the last attempt (e.g. ["b"]), so a future adaptive engine can
     * tell "wrong on part б" from "wrong on the whole task" instead of
     * only knowing the task as a whole was missed. Null for every other
     * answer type.
     */
    wrongParts: jsonb('wrong_parts').$type<readonly string[] | null>(),
    explanationOpened: boolean('explanation_opened').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('mistakes_user_task_idx').on(table.userId, table.taskId)],
);

/**
 * A user's saved tasks ("В избранное" bookmark on the Task screen) —
 * the (userId, taskId) unique index is what makes toggling idempotent
 * from the client (add is a plain insert that 409s on a duplicate,
 * remove is a plain delete) without a read-then-write race. Keyed by
 * the same anonymous `userId` every other per-user table uses (see
 * apps/api/src/plugins/anonUser.ts) — no separate identity system.
 */
export const favorites = pgTable(
  'favorites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    taskId: uuid('task_id')
      .notNull()
      .references(() => tasks.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('favorites_user_task_idx').on(table.userId, table.taskId)],
);
