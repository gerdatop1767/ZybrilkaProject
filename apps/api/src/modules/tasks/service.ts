import type { Database } from '@zybrilka/db';
import {
  checkAnswer,
  type AttemptRequest,
  type AttemptResult,
  type RandomTaskQuery,
  type TaskListQuery,
  type TaskListResponse,
  type TaskPublic,
  type TaskWithSolution,
} from '@zybrilka/shared';
import * as repo from './repo.js';

function toPublicTask({ task, topicName }: repo.TaskWithTopic): TaskPublic {
  return {
    id: task.id,
    subjectId: task.subjectId,
    taskNumber: task.taskNumber,
    topicId: task.topicId,
    topicName: topicName ?? null,
    difficulty: task.difficulty,
    conditionMd: task.conditionMd,
    imageUrl: task.imageUrl,
    answerType: task.answerType,
    answerOptions: task.answerOptions ? [...task.answerOptions] : null,
    source: task.source,
    sourceUrl: task.sourceUrl,
    sourceYear: task.sourceYear,
    tags: [...task.tags],
    status: task.status,
  };
}

function toTaskWithSolution(row: repo.TaskWithTopic): TaskWithSolution {
  return {
    ...toPublicTask(row),
    correctAnswer: row.task.correctAnswer,
    explanationMd: row.task.explanationMd,
  };
}

export async function listTasks(db: Database, query: TaskListQuery): Promise<TaskListResponse> {
  const { items, nextCursor } = await repo.listTasks(db, query);
  return { items: items.map(toPublicTask), nextCursor };
}

/**
 * Returns the task without its answer/explanation, UNLESS `userId` has
 * an attempt on record for it already — the one place the "never
 * before the attempt" rule (docs/ARCHITECTURE.md §4) is enforced.
 */
export async function getTask(
  db: Database,
  id: string,
  userId: string | null,
): Promise<TaskPublic | TaskWithSolution | undefined> {
  const row = await repo.getTaskById(db, id);
  if (!row) return undefined;
  const attempted = userId ? await repo.hasAttempt(db, userId, id) : false;
  return attempted ? toTaskWithSolution(row) : toPublicTask(row);
}

export async function getRandomTask(
  db: Database,
  query: RandomTaskQuery,
): Promise<TaskPublic | undefined> {
  const row = await repo.getRandomTask(db, query);
  return row && toPublicTask(row);
}

export async function submitAttempt(
  db: Database,
  taskId: string,
  userId: string,
  input: AttemptRequest,
): Promise<AttemptResult | undefined> {
  const row = await repo.getTaskById(db, taskId);
  if (!row) return undefined;

  // The only place correctness is decided — never trust a `correct`
  // flag sent by the client.
  const correct = checkAnswer(input.answer, row.task.correctAnswer);

  const attempt = await repo.createAttempt(db, {
    userId,
    taskId,
    answerRaw: input.answer,
    isCorrect: correct,
    timeSpentMs: input.timeSpentMs,
  });
  const mistakeId = await repo.applyAttemptToMistakes(db, {
    userId,
    taskId,
    attemptId: attempt.id,
    isCorrect: correct,
  });

  return {
    correct,
    correctAnswer: row.task.correctAnswer,
    explanation: row.task.explanationMd,
    attemptId: attempt.id,
    mistakeId,
  };
}
