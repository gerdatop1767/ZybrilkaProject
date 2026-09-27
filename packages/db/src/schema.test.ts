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

describe('collections / variants / variant_tasks (S3.2)', () => {
  let testDb: Awaited<ReturnType<typeof createTestDb>>;

  beforeAll(async () => {
    testDb = await createTestDb();
    await testDb.db.insert(schema.subjects).values({ id: 'math', name: 'Математика' });
  });

  afterAll(async () => {
    await testDb.close();
  });

  it('links two existing tasks into one variant, ordered by position, without duplicating the tasks', async () => {
    const { db } = testDb;
    const [collection] = await db
      .insert(schema.collections)
      .values({
        subjectId: 'math',
        slug: 'ege-2026-yashchenko',
        title: 'ЕГЭ 2026 Ященко',
        year: 2026,
      })
      .returning();
    const [variant] = await db
      .insert(schema.variants)
      .values({ collectionId: collection!.id, variantNumber: 1, title: 'Вариант 1' })
      .returning();

    const [taskA] = await db
      .insert(schema.tasks)
      .values({
        subjectId: 'math',
        taskNumber: 101,
        difficulty: 1,
        conditionMd: 'A',
        correctAnswer: '1',
        explanationMd: 'A.',
        source: 'demo',
        status: 'published',
      })
      .returning();
    const [taskB] = await db
      .insert(schema.tasks)
      .values({
        subjectId: 'math',
        taskNumber: 102,
        difficulty: 1,
        conditionMd: 'B',
        correctAnswer: '2',
        explanationMd: 'B.',
        source: 'demo',
        status: 'published',
      })
      .returning();

    await db.insert(schema.variantTasks).values([
      { variantId: variant!.id, taskId: taskA!.id, position: 1 },
      { variantId: variant!.id, taskId: taskB!.id, position: 2 },
    ]);

    const members = await db
      .select()
      .from(schema.variantTasks)
      .where(eq(schema.variantTasks.variantId, variant!.id))
      .orderBy(schema.variantTasks.position);
    expect(members).toHaveLength(2);
    expect(members.map((m) => m.taskId)).toEqual([taskA!.id, taskB!.id]);

    // Total tasks table is unaffected in count — no copies were created.
    const allTasks = await db.select().from(schema.tasks).where(eq(schema.tasks.subjectId, 'math'));
    expect(allTasks.filter((t) => t.id === taskA!.id || t.id === taskB!.id)).toHaveLength(2);
  });

  it('rejects a duplicate (variantId, taskId) membership row', async () => {
    const { db } = testDb;
    const [collection] = await db
      .insert(schema.collections)
      .values({ subjectId: 'math', slug: 'dup-collection', title: 'Dup' })
      .returning();
    const [variant] = await db
      .insert(schema.variants)
      .values({ collectionId: collection!.id, variantNumber: 1, title: 'V1' })
      .returning();
    const [task] = await db
      .insert(schema.tasks)
      .values({
        subjectId: 'math',
        taskNumber: 103,
        difficulty: 1,
        conditionMd: 'C',
        correctAnswer: '3',
        explanationMd: 'C.',
        source: 'demo',
        status: 'published',
      })
      .returning();

    await db
      .insert(schema.variantTasks)
      .values({ variantId: variant!.id, taskId: task!.id, position: 1 });
    await expect(
      db
        .insert(schema.variantTasks)
        .values({ variantId: variant!.id, taskId: task!.id, position: 2 }),
    ).rejects.toThrow();
  });

  it('rejects a duplicate variantNumber within the same collection', async () => {
    const { db } = testDb;
    const [collection] = await db
      .insert(schema.collections)
      .values({ subjectId: 'math', slug: 'dup-variant-number', title: 'Dup2' })
      .returning();
    await db
      .insert(schema.variants)
      .values({ collectionId: collection!.id, variantNumber: 1, title: 'V1' });
    await expect(
      db
        .insert(schema.variants)
        .values({ collectionId: collection!.id, variantNumber: 1, title: 'V1 again' }),
    ).rejects.toThrow();
  });

  it('rejects a duplicate collection slug', async () => {
    const { db } = testDb;
    await db
      .insert(schema.collections)
      .values({ subjectId: 'math', slug: 'dup-slug', title: 'First' });
    await expect(
      db
        .insert(schema.collections)
        .values({ subjectId: 'math', slug: 'dup-slug', title: 'Second' }),
    ).rejects.toThrow();
  });
});
