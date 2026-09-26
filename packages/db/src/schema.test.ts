import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as schema from './schema.js';
import { createTestDb } from './testing.js';

describe('task engine schema', () => {
  let testDb: Awaited<ReturnType<typeof createTestDb>>;

  beforeAll(async () => {
    testDb = await createTestDb();
  });

  afterAll(async () => {
    await testDb.close();
  });

  it('creates a subject, topic and task, and queries the task back', async () => {
    const { db } = testDb;
    await db.insert(schema.subjects).values({ id: 'math', name: 'Математика' });
    const [topic] = await db
      .insert(schema.topics)
      .values({ subjectId: 'math', slug: 'numbers', name: 'Числа и вычисления' })
      .returning();

    const [task] = await db
      .insert(schema.tasks)
      .values({
        subjectId: 'math',
        taskNumber: 1,
        topicId: topic!.id,
        difficulty: 1,
        conditionMd: 'Сколько будет 2 + 2?',
        correctAnswer: '4',
        explanationMd: '2 + 2 = 4.',
        source: 'demo',
        status: 'published',
      })
      .returning();

    expect(task).toBeDefined();
    const [found] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, task!.id));
    expect(found?.conditionMd).toBe('Сколько будет 2 + 2?');
    expect(found?.status).toBe('published');
  });

  it('records an attempt and a mistake, keeping attempt history on repeat attempts', async () => {
    const { db } = testDb;
    const [user] = await db.insert(schema.users).values({}).returning();
    const [task] = await db
      .insert(schema.tasks)
      .values({
        subjectId: 'math',
        taskNumber: 2,
        difficulty: 1,
        conditionMd: 'Сколько будет 3 + 3?',
        correctAnswer: '6',
        explanationMd: '3 + 3 = 6.',
        source: 'demo',
        status: 'published',
      })
      .returning();

    const [wrongAttempt] = await db
      .insert(schema.attempts)
      .values({ userId: user!.id, taskId: task!.id, answerRaw: '5', isCorrect: false })
      .returning();
    const [mistake] = await db
      .insert(schema.mistakes)
      .values({
        userId: user!.id,
        taskId: task!.id,
        firstAttemptId: wrongAttempt!.id,
        lastAttemptId: wrongAttempt!.id,
      })
      .returning();
    expect(mistake?.status).toBe('open');
    expect(mistake?.timesWrong).toBe(1);

    const [rightAttempt] = await db
      .insert(schema.attempts)
      .values({ userId: user!.id, taskId: task!.id, answerRaw: '6', isCorrect: true })
      .returning();
    await db
      .update(schema.mistakes)
      .set({ status: 'resolved', lastAttemptId: rightAttempt!.id, updatedAt: new Date() })
      .where(eq(schema.mistakes.id, mistake!.id));

    const [resolved] = await db
      .select()
      .from(schema.mistakes)
      .where(eq(schema.mistakes.id, mistake!.id));
    expect(resolved?.status).toBe('resolved');
    expect(resolved?.timesWrong).toBe(1); // history preserved, not deleted

    const allAttempts = await db
      .select()
      .from(schema.attempts)
      .where(eq(schema.attempts.taskId, task!.id));
    expect(allAttempts).toHaveLength(2);
  });

  it('enforces one mistake row per (user, task)', async () => {
    const { db } = testDb;
    const [user] = await db.insert(schema.users).values({}).returning();
    const [task] = await db
      .insert(schema.tasks)
      .values({
        subjectId: 'math',
        taskNumber: 3,
        difficulty: 1,
        conditionMd: 'Сколько будет 1 + 1?',
        correctAnswer: '2',
        explanationMd: '1 + 1 = 2.',
        source: 'demo',
        status: 'published',
      })
      .returning();
    const [attempt] = await db
      .insert(schema.attempts)
      .values({ userId: user!.id, taskId: task!.id, answerRaw: '3', isCorrect: false })
      .returning();
    await db.insert(schema.mistakes).values({
      userId: user!.id,
      taskId: task!.id,
      firstAttemptId: attempt!.id,
      lastAttemptId: attempt!.id,
    });

    await expect(
      db.insert(schema.mistakes).values({
        userId: user!.id,
        taskId: task!.id,
        firstAttemptId: attempt!.id,
        lastAttemptId: attempt!.id,
      }),
    ).rejects.toThrow();
  });
});
