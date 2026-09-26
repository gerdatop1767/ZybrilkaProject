import type { Database } from '@zybrilka/db';
import { schema } from '@zybrilka/db';
import { desc, eq } from 'drizzle-orm';

export async function listMistakes(db: Database, userId: string) {
  return db
    .select({
      mistake: schema.mistakes,
      task: schema.tasks,
      topicName: schema.topics.name,
      userAnswer: schema.attempts.answerRaw,
    })
    .from(schema.mistakes)
    .innerJoin(schema.tasks, eq(schema.mistakes.taskId, schema.tasks.id))
    .leftJoin(schema.topics, eq(schema.tasks.topicId, schema.topics.id))
    .innerJoin(schema.attempts, eq(schema.mistakes.lastAttemptId, schema.attempts.id))
    .where(eq(schema.mistakes.userId, userId))
    .orderBy(desc(schema.mistakes.updatedAt));
}
