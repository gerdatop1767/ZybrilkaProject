import type { Database } from '@zybrilka/db';
import type { Mistake } from '@zybrilka/shared';
import * as repo from './repo.js';

export async function listMistakes(db: Database, userId: string): Promise<Mistake[]> {
  const rows = await repo.listMistakes(db, userId);
  return rows.map((row) => ({
    id: row.mistake.id,
    taskId: row.task.id,
    subjectId: row.task.subjectId,
    taskNumber: row.task.taskNumber,
    topicName: row.topicName,
    conditionMd: row.task.conditionMd,
    userAnswer: row.userAnswer,
    correctAnswer: row.task.correctAnswer,
    timesWrong: row.mistake.timesWrong,
    status: row.mistake.status,
    createdAt: row.mistake.createdAt.toISOString(),
    updatedAt: row.mistake.updatedAt.toISOString(),
  }));
}
