import type { Database } from '@zybrilka/db';
import { schema } from '@zybrilka/db';
import { count, eq, sql } from 'drizzle-orm';

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
