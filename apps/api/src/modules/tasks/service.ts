import type { Database } from '@zybrilka/db';
import {
  checkAnswer,
  checkIntervalAnswer,
  gradeMultiPart,
  parseMultiPartSpec,
  serializeMultiPartUserAnswer,
  type AttemptRequest,
  type AttemptResult,
  type RandomTaskQuery,
  type TaskListQuery,
  type TaskListResponse,
  type TaskPublic,
  type TaskWithSolution,
} from '@zybrilka/shared';
import * as repo from './repo.js';
import { getCanonicalSolutionForTask } from './canonicalSolution.js';
import { updateSkillStatisticsForTaskAttempt } from '../learning/service.js';

/** Thrown when the request's `answer` shape doesn't match the task's answerType — the route maps this to a 400, never a 500. */
export class InvalidAnswerShapeError extends Error {
  constructor() {
    super('answer shape does not match the task answerType');
  }
}

/** Exported for modules/variants/service.ts — the full variant view maps tasks through the exact same shape. */
export function toPublicTask({ task, topicName }: repo.TaskWithTopic): TaskPublic {
  return {
    id: task.id,
    subjectId: task.subjectId,
    taskNumber: task.taskNumber,
    topicId: task.topicId,
    topicName: topicName ?? null,
    difficulty: task.difficulty,
    conditionMd: task.conditionMd,
    imageUrl: task.imageUrl,
    hintMd: task.hintMd,
    answerType: task.answerType,
    answerOptions: task.answerOptions ? [...task.answerOptions] : null,
    answerParts:
      task.answerType === 'multi_part'
        ? (parseMultiPartSpec(task.correctAnswer)?.parts.map((p) => ({
            id: p.id,
            label: p.label,
          })) ?? null)
        : null,
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
    correctAnswerDisplay: row.task.correctAnswerDisplay,
    explanationMd: row.task.explanationMd,
    solutionSteps: row.task.solutionSteps ? [...row.task.solutionSteps] : null,
    // Additional, separate source of solution content — never touches
    // explanationMd/solutionSteps above. undefined for every task
    // except the one real task this has authored content for.
    canonicalSolution: getCanonicalSolutionForTask(row.task),
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
  // flag sent by the client. `answer` shape must match this task's
  // answerType (object only for multi_part) or the request is rejected
  // before anything is written.
  if (row.task.answerType === 'multi_part') {
    if (typeof input.answer !== 'object') throw new InvalidAnswerShapeError();
    return submitMultiPartAttempt(db, row, userId, input.answer, input.timeSpentMs);
  }
  if (typeof input.answer !== 'string') throw new InvalidAnswerShapeError();
  const answerRaw = input.answer;

  const correct =
    row.task.answerType === 'interval'
      ? checkIntervalAnswer(answerRaw, row.task.correctAnswer)
      : checkAnswer(answerRaw, row.task.correctAnswer);

  // One transaction: the attempt, its mistakes update, and the skill
  // statistics it feeds (ZUBRILKA LEARNING INTELLIGENCE Phase 3) must
  // never diverge — either all three are written, or none are.
  const { attempt, mistakeId } = await db.transaction(async (tx) => {
    const attempt = await repo.createAttempt(tx, {
      userId,
      taskId,
      answerRaw,
      isCorrect: correct,
      timeSpentMs: input.timeSpentMs,
    });
    const mistakeId = await repo.applyAttemptToMistakes(tx, {
      userId,
      taskId,
      attemptId: attempt.id,
      isCorrect: correct,
      wrongParts: null,
    });
    await updateSkillStatisticsForTaskAttempt(tx, userId, taskId);
    return { attempt, mistakeId };
  });

  return {
    correct,
    correctAnswer: row.task.correctAnswer,
    correctAnswerDisplay: row.task.correctAnswerDisplay,
    explanation: row.task.explanationMd,
    attemptId: attempt.id,
    mistakeId,
  };
}

async function submitMultiPartAttempt(
  db: Database,
  row: repo.TaskWithTopic,
  userId: string,
  answer: Readonly<Record<string, string>>,
  timeSpentMs: number | undefined,
): Promise<AttemptResult> {
  const spec = parseMultiPartSpec(row.task.correctAnswer);
  // A malformed spec is a data problem on our side, not the user's —
  // grade as "no parts correct" rather than crashing the request.
  const grading = spec
    ? gradeMultiPart(spec, answer)
    : { parts: [], correctParts: 0, totalParts: 0, status: 'all_incorrect' as const };

  const wrongParts = grading.parts.filter((p) => !p.correct).map((p) => p.id);
  const { attempt, mistakeId } = await db.transaction(async (tx) => {
    const attempt = await repo.createAttempt(tx, {
      userId,
      taskId: row.task.id,
      answerRaw: serializeMultiPartUserAnswer(answer),
      isCorrect: grading.status === 'all_correct',
      timeSpentMs,
    });
    const mistakeId = await repo.applyAttemptToMistakes(tx, {
      userId,
      taskId: row.task.id,
      attemptId: attempt.id,
      isCorrect: grading.status === 'all_correct',
      wrongParts: wrongParts.length > 0 ? wrongParts : null,
    });
    await updateSkillStatisticsForTaskAttempt(tx, userId, row.task.id);
    return { attempt, mistakeId };
  });

  return {
    correct: grading.status === 'all_correct',
    correctAnswer: row.task.correctAnswer,
    correctAnswerDisplay: row.task.correctAnswerDisplay,
    explanation: row.task.explanationMd,
    attemptId: attempt.id,
    mistakeId,
    parts: [...grading.parts],
    correctParts: grading.correctParts,
    totalParts: grading.totalParts,
    partStatus: grading.status,
  };
}
