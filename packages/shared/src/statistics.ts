import { z } from 'zod';

/**
 * Statistics 2.0 — detailed per-task-number statistics (Subject/
 * Statistics "По номерам" → detail). Additive to the existing
 * `ProgressByTaskNumberResponse` (total/completed coverage): this is
 * the deep-dive a user gets after tapping a specific number, built
 * entirely from real `attempts`/`task_skills`/`user_skill_statistics`
 * — never fake/0 values when data is simply absent (`null` instead).
 */
export const taskNumberStatisticsDetailQuerySchema = z.object({
  subject: z.string(),
});
export type TaskNumberStatisticsDetailQuery = z.infer<typeof taskNumberStatisticsDetailQuerySchema>;

export const errorBreakdownItemSchema = z.object({
  /** One of the fixed `ErrorSignatureType` codes, or `"type:partId"`
   * for a multi_part per-part signature — see
   * `packages/shared/src/learning/errorSignatures.ts`. Never a new
   * signature invented here. */
  signature: z.string(),
  count: z.number().int().positive(),
});
export type ErrorBreakdownItem = z.infer<typeof errorBreakdownItemSchema>;

export const skillBreakdownItemSchema = z.object({
  skillId: z.uuid(),
  skillName: z.string(),
  /** This user's real `user_skill_statistics.mastery` for the skill —
   * 0 when the skill has never been attempted (not "no data"), since a
   * task_skills link to it already exists for this task number. */
  mastery: z.number().int().min(0).max(100),
  attempts: z.number().int().nonnegative(),
});
export type SkillBreakdownItem = z.infer<typeof skillBreakdownItemSchema>;

export const accuracyTrendPointSchema = z.object({
  createdAt: z.string(),
  isCorrect: z.boolean(),
});
export type AccuracyTrendPoint = z.infer<typeof accuracyTrendPointSchema>;

export const timeTrendPointSchema = z.object({
  createdAt: z.string(),
  timeSpentMs: z.number().int().nonnegative(),
});
export type TimeTrendPoint = z.infer<typeof timeTrendPointSchema>;

export const speedBaselineLevelSchema = z.enum(['taskNumber', 'skill', 'subject', 'global']);

export const speedSignalResponseSchema = z.object({
  value: z.number().min(0).max(100).nullable(),
  baselineLevel: speedBaselineLevelSchema.nullable(),
  baselineMedianMs: z.number().nonnegative().nullable(),
  sampleSize: z.number().int().nonnegative(),
});
export type SpeedSignalResponse = z.infer<typeof speedSignalResponseSchema>;

export const taskNumberStatisticsDetailSchema = z.object({
  subjectId: z.string(),
  taskNumber: z.number().int().positive(),
  /** Every submitted attempt — repeat attempts on the same task all count. */
  attempts: z.number().int().nonnegative(),
  /** Distinct tasks attempted at least once — never conflated with `attempts`. */
  uniqueTasksAttempted: z.number().int().nonnegative(),
  correctAttempts: z.number().int().nonnegative(),
  incorrectAttempts: z.number().int().nonnegative(),
  /** `null` when `attempts` is 0 — never a fabricated 0%. */
  accuracy: z.number().min(0).max(100).nullable(),
  /** Mean over timed attempts only; `null` when `timedAttempts` is 0. */
  averageTimeMs: z.number().nonnegative().nullable(),
  /** Median over timed attempts only — robust to one slow outlier. */
  medianTimeMs: z.number().nonnegative().nullable(),
  /** How many attempts actually carried a real `timeSpentMs` — an
   * untimed attempt is never silently treated as 0 seconds. */
  timedAttempts: z.number().int().nonnegative(),
  lastAttemptAt: z.string().nullable(),
  /** Deterministic error-signature counts, scoped to just this task
   * number (unlike the global `/me/learning/errors`). */
  errorBreakdown: z.array(errorBreakdownItemSchema),
  /** Only the skills actually linked (via `task_skills`) to this task
   * number's tasks — empty array (never invented skills) when none are
   * tagged yet. */
  skillBreakdown: z.array(skillBreakdownItemSchema),
  /** Accuracy over the most recent `min(10, attempts)` attempts;
   * `null` below a minimum of 3 attempts. */
  recentAccuracy: z.number().min(0).max(100).nullable(),
  /** Accuracy over the window of attempts immediately before the
   * recent one — `null` unless a full previous window actually exists
   * (never a false "улучшение/ухудшение" comparison). */
  previousAccuracy: z.number().min(0).max(100).nullable(),
  recentAverageTimeMs: z.number().nonnegative().nullable(),
  /** Ordered oldest -> newest, capped to a reasonable chart length. */
  accuracyTrend: z.array(accuracyTrendPointSchema),
  timeTrend: z.array(timeTrendPointSchema),
  speedSignal: speedSignalResponseSchema,
});
export type TaskNumberStatisticsDetail = z.infer<typeof taskNumberStatisticsDetailSchema>;
