import type { Database } from '@zybrilka/db';
import { calculateTaskDifficulty, type TaskStatisticsEntry } from '@zybrilka/shared';
import * as repo from './repo.js';

/**
 * Recomputes and stores one task's statistics, always from its FULL
 * attempt history (never an incremental +=) — the same recompute
 * `rebuildTaskStatistics` runs per task, so calling this after every
 * attempt and running a full rebuild always converge to the same
 * numbers. Resolved purely by `taskId` — never a `taskNumber` check —
 * so any task is covered automatically the moment it has attempts.
 */
export async function updateTaskStatistics(db: Database, taskId: string): Promise<void> {
  const attemptRecords = await repo.getAttemptRecordsForTask(db, taskId);
  const result = calculateTaskDifficulty(attemptRecords);
  await repo.upsertTaskStatistics(db, taskId, result);
}

/**
 * Deterministic, idempotent recompute of every task that has ever
 * received an attempt, straight from `attempts` — safe to run
 * repeatedly. Running it twice in a row with no new attempts in
 * between produces identical rows.
 */
export async function rebuildTaskStatistics(db: Database): Promise<{ tasksUpdated: number }> {
  const taskIds = await repo.getDistinctAttemptedTaskIds(db);
  for (const taskId of taskIds) {
    await updateTaskStatistics(db, taskId);
  }
  return { tasksUpdated: taskIds.length };
}

/** Cold start (no attempts yet) returns the same null/0 shape as a
 * real row with 0 attempts — never a 404, since "no statistics yet"
 * is a valid, expected state for a task, not an error. */
export async function getTaskStatisticsEntry(
  db: Database,
  taskId: string,
): Promise<TaskStatisticsEntry> {
  const row = await repo.getTaskStatistics(db, taskId);
  if (!row) {
    return {
      taskId,
      attempts: 0,
      correctAttempts: 0,
      incorrectAttempts: 0,
      accuracy: null,
      difficulty: null,
      confidence: 0,
      averageTimeMs: null,
      lastAttemptAt: null,
    };
  }
  return {
    taskId: row.taskId,
    attempts: row.attempts,
    correctAttempts: row.correctAttempts,
    incorrectAttempts: row.incorrectAttempts,
    accuracy: row.accuracy,
    difficulty: row.difficulty,
    confidence: row.confidence,
    averageTimeMs: row.averageTimeMs,
    lastAttemptAt: row.lastAttemptAt ? row.lastAttemptAt.toISOString() : null,
  };
}
