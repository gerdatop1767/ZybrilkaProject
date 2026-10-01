import { randomUUID } from 'node:crypto';
import { schema } from '@zybrilka/db';
import { createImportedTestDb } from '@zybrilka/db/testing';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getNextTaskRecommendation } from './service.js';

describe('getNextTaskRecommendation (ZUBRILKA LEARNING INTELLIGENCE Phase 7)', () => {
  let testDb: Awaited<ReturnType<typeof createImportedTestDb>>;

  beforeAll(async () => {
    testDb = await createImportedTestDb();
  });

  afterAll(async () => {
    await testDb.close();
  });

  it('returns null for a user with no onboarded subject and no explicit subjectId', async () => {
    const result = await getNextTaskRecommendation(testDb.db, randomUUID(), {});
    expect(result).toBeNull();
  });

  it('returns null for an explicit subjectId with no published tasks', async () => {
    const result = await getNextTaskRecommendation(testDb.db, randomUUID(), {
      subjectId: '__nonexistent_subject__',
    });
    expect(result).toBeNull();
  });

  it('recommends a real published task in the requested subject, with a full breakdown', async () => {
    const [task] = await testDb.db.select().from(schema.tasks).limit(1);
    const result = await getNextTaskRecommendation(testDb.db, randomUUID(), {
      subjectId: task!.subjectId,
    });
    expect(result).not.toBeNull();
    expect(result!.subjectId).toBe(task!.subjectId);
    expect(result!.score).toBeGreaterThanOrEqual(0);
    expect(result!.score).toBeLessThanOrEqual(100);
    expect(Object.keys(result!.breakdown)).toEqual([
      'skillNeed',
      'errorRelevance',
      'difficultyFit',
      'targetRelevance',
      'recency',
      'examImportance',
      'similarityBonus',
    ]);
  });

  it('is deterministic for a cold-start (no history) user', async () => {
    const [task] = await testDb.db.select().from(schema.tasks).limit(1);
    const first = await getNextTaskRecommendation(testDb.db, randomUUID(), {
      subjectId: task!.subjectId,
    });
    const second = await getNextTaskRecommendation(testDb.db, randomUUID(), {
      subjectId: task!.subjectId,
    });
    // Different random userIds, but BOTH cold-start -> identical honest "no data" output.
    expect(first).toEqual(second);
  });

  it('never recommends a task the user already answered correctly, while unsolved alternatives exist', async () => {
    const [task] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.subjectId, 'math'));
    const userId = randomUUID();
    await testDb.db.insert(schema.users).values({ id: userId });
    await testDb.db.insert(schema.attempts).values({
      userId,
      taskId: task!.id,
      answerRaw: task!.correctAnswer,
      isCorrect: true,
    });

    const result = await getNextTaskRecommendation(testDb.db, userId, { subjectId: 'math' });
    expect(result?.taskId).not.toBe(task!.id);
  });

  it('falls back to the full pool when every task in the subject is already solved', async () => {
    const mathTasks = await testDb.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.subjectId, 'math'));
    const userId = randomUUID();
    await testDb.db.insert(schema.users).values({ id: userId });
    for (const task of mathTasks) {
      await testDb.db.insert(schema.attempts).values({
        userId,
        taskId: task.id,
        answerRaw: task.correctAnswer,
        isCorrect: true,
      });
    }

    const result = await getNextTaskRecommendation(testDb.db, userId, { subjectId: 'math' });
    // Still recommends something (review mode) rather than null, since
    // published tasks genuinely exist in the subject.
    expect(result).not.toBeNull();
  });
});
