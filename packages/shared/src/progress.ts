import { z } from 'zod';

export const progressSummarySchema = z.object({
  solvedTotal: z.number().int().nonnegative(),
  correctTotal: z.number().int().nonnegative(),
  incorrectTotal: z.number().int().nonnegative(),
  accuracyPercent: z.number().min(0).max(100),
  bySubject: z.array(
    z.object({
      subjectId: z.string(),
      solved: z.number().int().nonnegative(),
      correct: z.number().int().nonnegative(),
      accuracyPercent: z.number().min(0).max(100),
    }),
  ),
  byTaskNumber: z.array(
    z.object({
      subjectId: z.string(),
      taskNumber: z.number().int().positive(),
      solved: z.number().int().nonnegative(),
      correct: z.number().int().nonnegative(),
      accuracyPercent: z.number().min(0).max(100),
    }),
  ),
  byTopic: z.array(
    z.object({
      topicId: z.uuid(),
      topicName: z.string(),
      solved: z.number().int().nonnegative(),
      correct: z.number().int().nonnegative(),
      accuracyPercent: z.number().min(0).max(100),
    }),
  ),
});
export type ProgressSummary = z.infer<typeof progressSummarySchema>;

/**
 * Same collection/variant scoping shape as TaskListQuery/RandomTaskQuery
 * (packages/shared/src/tasks.ts) — no filter given means "aggregate
 * across every source", exactly one of collection/variant given means
 * "only this source's tasks". Works unchanged for any future
 * collection/variant, never a specific publisher's id.
 */
export const progressByTaskNumberQuerySchema = z.object({
  subject: z.string().optional(),
  collection: z.string().optional(),
  variant: z.uuid().optional(),
});
export type ProgressByTaskNumberQuery = z.infer<typeof progressByTaskNumberQuerySchema>;

export const progressByTaskNumberResponseSchema = z.object({
  items: z.array(
    z.object({
      subjectId: z.string(),
      taskNumber: z.number().int().positive(),
      /** Real, unique tasks available for this number under the given filters. */
      total: z.number().int().nonnegative(),
      /** Unique tasks (not attempts) the current user has answered at least once. */
      completed: z.number().int().nonnegative(),
    }),
  ),
});
export type ProgressByTaskNumberResponse = z.infer<typeof progressByTaskNumberResponseSchema>;
