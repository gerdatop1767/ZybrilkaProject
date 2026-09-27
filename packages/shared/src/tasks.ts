import { z } from 'zod';

export const taskAnswerTypeSchema = z.enum(['short_answer', 'multiple_choice']);
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

export const attemptRequestSchema = z.object({
  answer: z.string().min(1).max(2000),
  timeSpentMs: z.number().int().nonnegative().optional(),
});
export type AttemptRequest = z.infer<typeof attemptRequestSchema>;

export const attemptResultSchema = z.object({
  correct: z.boolean(),
  correctAnswer: z.string(),
  explanation: z.string(),
  attemptId: z.uuid(),
  mistakeId: z.uuid().nullable(),
});
export type AttemptResult = z.infer<typeof attemptResultSchema>;
