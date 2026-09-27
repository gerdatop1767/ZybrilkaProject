import { z } from 'zod';

/**
 * `interval` and `multi_part` reuse the existing single
 * `correctAnswer`/`answerRaw` TEXT columns by convention: for
 * `interval` it's still a plain interval-set string (see
 * intervalAnswer.ts); for `multi_part` it's JSON (see
 * multiPartAnswer.ts). No separate INTEGER/DECIMAL/FRACTION/FREE_TEXT
 * types — the existing answer checker already normalizes all of those
 * identically, so splitting them out would just be duplication with no
 * behavior difference.
 */
export const taskAnswerTypeSchema = z.enum([
  'short_answer',
  'multiple_choice',
  'interval',
  'multi_part',
]);
export type TaskAnswerType = z.infer<typeof taskAnswerTypeSchema>;

export const taskStatusSchema = z.enum(['draft', 'published', 'archived', 'needs_review']);
export type TaskStatus = z.infer<typeof taskStatusSchema>;

/**
 * A task as sent to the client BEFORE that user has an attempt on
 * record for it — never `correctAnswer` or `explanation`
 * (docs/ARCHITECTURE.md §4: "never sent to the client before the
 * attempt is recorded on the server").
 */
export const taskPublicSchema = z.object({
  id: z.uuid(),
  subjectId: z.string(),
  taskNumber: z.number().int().positive(),
  topicId: z.uuid().nullable(),
  topicName: z.string().nullable(),
  difficulty: z.number().int().min(1).max(3),
  conditionMd: z.string(),
  imageUrl: z.string().nullable(),
  answerType: taskAnswerTypeSchema,
  answerOptions: z.array(z.string()).nullable(),
  source: z.string(),
  sourceUrl: z.string().nullable(),
  sourceYear: z.number().int().nullable(),
  tags: z.array(z.string()),
  status: taskStatusSchema,
});
export type TaskPublic = z.infer<typeof taskPublicSchema>;

/** Same task, once the current user has attempted it — includes the answer key. */
export const taskWithSolutionSchema = taskPublicSchema.extend({
  correctAnswer: z.string(),
  explanationMd: z.string(),
});
export type TaskWithSolution = z.infer<typeof taskWithSolutionSchema>;

export const taskListQuerySchema = z.object({
  subject: z.string().optional(),
  taskNumber: z.coerce.number().int().positive().optional(),
  topic: z.uuid().optional(),
  difficulty: z.coerce.number().int().min(1).max(3).optional(),
  // 'needs_review' is deliberately excluded here — it must never be
  // reachable through the public list endpoint, even by an explicit
  // query param, unlike the other statuses this endpoint already allows.
  status: z.enum(['draft', 'published', 'archived']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});
export type TaskListQuery = z.infer<typeof taskListQuerySchema>;

export const taskListResponseSchema = z.object({
  items: z.array(taskPublicSchema),
  nextCursor: z.string().nullable(),
});
export type TaskListResponse = z.infer<typeof taskListResponseSchema>;

export const randomTaskQuerySchema = z.object({
  subject: z.string().optional(),
  taskNumber: z.coerce.number().int().positive().optional(),
});
export type RandomTaskQuery = z.infer<typeof randomTaskQuerySchema>;

/** A single string for short_answer/multiple_choice/interval tasks, or {partId: answer} for multi_part. */
export const attemptAnswerSchema = z.union([
  z.string().min(1).max(2000),
  z.record(z.string().min(1), z.string().min(1).max(2000)),
]);
export type AttemptAnswer = z.infer<typeof attemptAnswerSchema>;

export const attemptRequestSchema = z.object({
  answer: attemptAnswerSchema,
  timeSpentMs: z.number().int().nonnegative().optional(),
});
export type AttemptRequest = z.infer<typeof attemptRequestSchema>;

export const multiPartStatusSchema = z.enum(['all_correct', 'partially_correct', 'all_incorrect']);
export type MultiPartResultStatus = z.infer<typeof multiPartStatusSchema>;

export const attemptPartResultSchema = z.object({
  id: z.string(),
  label: z.string(),
  correct: z.boolean(),
});
export type AttemptPartResult = z.infer<typeof attemptPartResultSchema>;

export const attemptResultSchema = z.object({
  correct: z.boolean(),
  correctAnswer: z.string(),
  explanation: z.string(),
  attemptId: z.uuid(),
  mistakeId: z.uuid().nullable(),
  // Present only for multi_part tasks — per-part breakdown of a single logical attempt.
  parts: z.array(attemptPartResultSchema).optional(),
  correctParts: z.number().int().nonnegative().optional(),
  totalParts: z.number().int().nonnegative().optional(),
  partStatus: multiPartStatusSchema.optional(),
});
export type AttemptResult = z.infer<typeof attemptResultSchema>;
