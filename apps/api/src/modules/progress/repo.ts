import type { Database } from '@zybrilka/db';
import { schema } from '@zybrilka/db';
import type { ProgressByTaskNumberQuery } from '@zybrilka/shared';
import { and, count, countDistinct, eq, inArray, sql } from 'drizzle-orm';
import { taskIdsForCollectionOrVariant } from '../tasks/repo.js';

export async function getTotals(db: Database, userId: string) {
  const [row] = await db
    .select({
      solved: count(),
      correct: count(sql`case when ${schema.attempts.isCorrect} then 1 end`),
    })
    .from(schema.attempts)
    .where(eq(schema.attempts.userId, userId));
  return { solved: row?.solved ?? 0, correct: row?.correct ?? 0 };
}

export async function getBySubject(db: Database, userId: string) {
  return db
    .select({
      subjectId: schema.tasks.subjectId,
      solved: count(),
      correct: count(sql`case when ${schema.attempts.isCorrect} then 1 end`),
    })
    .from(schema.attempts)
    .innerJoin(schema.tasks, eq(schema.attempts.taskId, schema.tasks.id))
    .where(eq(schema.attempts.userId, userId))
    .groupBy(schema.tasks.subjectId);
}

export async function getByTaskNumber(db: Database, userId: string) {
  return db
    .select({
      subjectId: schema.tasks.subjectId,
      taskNumber: schema.tasks.taskNumber,
      solved: count(),
      correct: count(sql`case when ${schema.attempts.isCorrect} then 1 end`),
    })
    .from(schema.attempts)
    .innerJoin(schema.tasks, eq(schema.attempts.taskId, schema.tasks.id))
    .where(eq(schema.attempts.userId, userId))
    .groupBy(schema.tasks.subjectId, schema.tasks.taskNumber);
}

export async function getByTopic(db: Database, userId: string) {
  return db
    .select({
      topicId: schema.tasks.topicId,
      topicName: schema.topics.name,
      solved: count(),
      correct: count(sql`case when ${schema.attempts.isCorrect} then 1 end`),
    })
    .from(schema.attempts)
    .innerJoin(schema.tasks, eq(schema.attempts.taskId, schema.tasks.id))
    .innerJoin(schema.topics, eq(schema.tasks.topicId, schema.topics.id))
    .where(eq(schema.attempts.userId, userId))
    .groupBy(schema.tasks.topicId, schema.topics.name);
}

/**
 * Real per-task-number coverage — `total` is how many distinct
 * *published* tasks exist for a number under the given subject/
 * collection/variant scope (the exact same scoping GET /tasks and
 * GET /tasks/random use, via `taskIdsForCollectionOrVariant`); no
 * collection/variant filter means "every source" (the aggregate bank),
 * one of them means "only that source" — never a hardcoded id.
 * `completed` counts distinct tasks (not attempt rows) this user has
 * answered at least once, so a repeated attempt on the same task never
 * inflates it, and another user's attempts never affect it.
 */
export async function getByTaskNumberWithTotals(
  db: Database,
  userId: string,
  filters: ProgressByTaskNumberQuery,
) {
  const conditions = [eq(schema.tasks.status, 'published' as const)];
  if (filters.subject) conditions.push(eq(schema.tasks.subjectId, filters.subject));
  const scoped = taskIdsForCollectionOrVariant(db, filters);
  if (scoped) conditions.push(inArray(schema.tasks.id, scoped));
  const where = and(...conditions);

  const totals = await db
    .select({
      subjectId: schema.tasks.subjectId,
      taskNumber: schema.tasks.taskNumber,
      total: count(),
    })
    .from(schema.tasks)
    .where(where)
    .groupBy(schema.tasks.subjectId, schema.tasks.taskNumber);

  const completed = await db
    .select({
      subjectId: schema.tasks.subjectId,
      taskNumber: schema.tasks.taskNumber,
      completed: countDistinct(schema.tasks.id),
    })
    .from(schema.tasks)
    .innerJoin(
      schema.attempts,
      and(eq(schema.attempts.taskId, schema.tasks.id), eq(schema.attempts.userId, userId)),
    )
    .where(where)
    .groupBy(schema.tasks.subjectId, schema.tasks.taskNumber);

  const completedByKey = new Map(
    completed.map((row) => [`${row.subjectId}:${row.taskNumber}`, row.completed]),
  );

  return totals.map((row) => ({
    subjectId: row.subjectId,
    taskNumber: row.taskNumber,
    total: row.total,
    completed: completedByKey.get(`${row.subjectId}:${row.taskNumber}`) ?? 0,
  }));
}
