import type { Database } from '@zybrilka/db';
import type {
  ProgressByTaskNumberQuery,
  ProgressByTaskNumberResponse,
  ProgressSummary,
} from '@zybrilka/shared';
import * as repo from './repo.js';

function accuracy(solved: number, correct: number): number {
  if (solved === 0) return 0;
  return Math.round((correct / solved) * 1000) / 10;
}

export async function getSummary(db: Database, userId: string): Promise<ProgressSummary> {
  const [totals, bySubject, byTaskNumber, byTopic] = await Promise.all([
    repo.getTotals(db, userId),
    repo.getBySubject(db, userId),
    repo.getByTaskNumber(db, userId),
    repo.getByTopic(db, userId),
  ]);

  return {
    solvedTotal: totals.solved,
    correctTotal: totals.correct,
    incorrectTotal: totals.solved - totals.correct,
    accuracyPercent: accuracy(totals.solved, totals.correct),
    bySubject: bySubject.map((row) => ({
      subjectId: row.subjectId,
      solved: row.solved,
      correct: row.correct,
      accuracyPercent: accuracy(row.solved, row.correct),
    })),
    byTaskNumber: byTaskNumber.map((row) => ({
      subjectId: row.subjectId,
      taskNumber: row.taskNumber,
      solved: row.solved,
      correct: row.correct,
      accuracyPercent: accuracy(row.solved, row.correct),
    })),
    byTopic: byTopic
      .filter((row) => row.topicId !== null)
      .map((row) => ({
        topicId: row.topicId!,
        topicName: row.topicName,
        solved: row.solved,
        correct: row.correct,
        accuracyPercent: accuracy(row.solved, row.correct),
      })),
  };
}

export async function getByTaskNumberWithTotals(
  db: Database,
  userId: string,
  filters: ProgressByTaskNumberQuery,
): Promise<ProgressByTaskNumberResponse> {
  const items = await repo.getByTaskNumberWithTotals(db, userId, filters);
  return { items };
}
