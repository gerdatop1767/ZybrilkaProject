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
