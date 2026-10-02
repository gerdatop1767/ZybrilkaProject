import type { Database } from '@zybrilka/db';
import { schema } from '@zybrilka/db';
import type { TaskAttemptRecord, TaskDifficultyResult } from '@zybrilka/shared';
import { eq } from 'drizzle-orm';

/** Every attempt ever made on this one task, across all users — the
 * full history `calculateTaskDifficulty` needs, in any order (it
 * sorts internally). Source of truth is `attempts` directly; no
 * separate task-specific attempt log. */
export async function getAttemptRecordsForTask(
  db: Database,
  taskId: string,
): Promise<TaskAttemptRecord[]> {
  const rows = await db
    .select({
      isCorrect: schema.attempts.isCorrect,
      createdAt: schema.attempts.createdAt,
      timeSpentMs: schema.attempts.timeSpentMs,
    })
    .from(schema.attempts)
    .where(eq(schema.attempts.taskId, taskId));
  return rows;
}

export async function getDistinctAttemptedTaskIds(db: Database): Promise<string[]> {
  const rows = await db.selectDistinct({ taskId: schema.attempts.taskId }).from(schema.attempts);
  return rows.map((r) => r.taskId);
}

/** Idempotent: always a full overwrite from a freshly computed
 * `TaskDifficultyResult`, never an incremental += — so the per-attempt
 * update and a full rebuild always converge to the same row. */
export async function upsertTaskStatistics(
  db: Database,
  taskId: string,
  result: TaskDifficultyResult,
): Promise<void> {
  await db
    .insert(schema.taskStatistics)
    .values({
      taskId,
      attempts: result.attempts,
      correctAttempts: result.correctAttempts,
      incorrectAttempts: result.incorrectAttempts,
      accuracy: result.accuracy,
      difficulty: result.difficulty,
      confidence: result.confidence,
      averageTimeMs: result.averageTimeMs,
      lastAttemptAt: result.lastAttemptAt,
    })
    .onConflictDoUpdate({
      target: schema.taskStatistics.taskId,
      set: {
        attempts: result.attempts,
        correctAttempts: result.correctAttempts,
        incorrectAttempts: result.incorrectAttempts,
        accuracy: result.accuracy,
        difficulty: result.difficulty,
        confidence: result.confidence,
        averageTimeMs: result.averageTimeMs,
        lastAttemptAt: result.lastAttemptAt,
        updatedAt: new Date(),
      },
    });
}

export interface TaskStatisticsRow {
  readonly taskId: string;
  readonly attempts: number;
  readonly correctAttempts: number;
  readonly incorrectAttempts: number;
  readonly accuracy: number | null;
  readonly difficulty: number | null;
  readonly confidence: number;
  readonly averageTimeMs: number | null;
  readonly lastAttemptAt: Date | null;
}

export async function getTaskStatistics(
  db: Database,
  taskId: string,
): Promise<TaskStatisticsRow | undefined> {
  const [row] = await db
    .select({
      taskId: schema.taskStatistics.taskId,
      attempts: schema.taskStatistics.attempts,
      correctAttempts: schema.taskStatistics.correctAttempts,
      incorrectAttempts: schema.taskStatistics.incorrectAttempts,
      accuracy: schema.taskStatistics.accuracy,
      difficulty: schema.taskStatistics.difficulty,
      confidence: schema.taskStatistics.confidence,
      averageTimeMs: schema.taskStatistics.averageTimeMs,
      lastAttemptAt: schema.taskStatistics.lastAttemptAt,
    })
    .from(schema.taskStatistics)
    .where(eq(schema.taskStatistics.taskId, taskId));
  return row;
}

/** Used only by tests to assert a rebuild starts from a clean slate. */
export async function deleteTaskStatistics(db: Database, taskId: string): Promise<void> {
  await db.delete(schema.taskStatistics).where(eq(schema.taskStatistics.taskId, taskId));
}
