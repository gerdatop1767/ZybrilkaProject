import { randomUUID } from 'node:crypto';
import { schema } from '@zybrilka/db';
import { createSeededTestDb } from '@zybrilka/db/testing';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../app.js';

describe('GET /api/v1/mistakes', () => {
  let testDb: Awaited<ReturnType<typeof createSeededTestDb>>;
  let app: ReturnType<typeof buildApp>;

  beforeAll(async () => {
    testDb = await createSeededTestDb();
    app = buildApp({ version: 'test', db: testDb.db });
  });

  afterAll(async () => {
    await app.close();
    await testDb.close();
  });

  it('requires an x-anon-id header', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/mistakes' });
    expect(res.statusCode).toBe(400);
  });

  it("lists a mistake with the user's wrong answer and the correct one, and keeps it after being resolved", async () => {
    const [task] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.taskNumber, 1));
    const anonId = randomUUID();

    await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task!.id}/attempt`,
      headers: { 'x-anon-id': anonId },
      payload: { answer: 'wrong answer' },
    });

    const firstList = await app.inject({
      method: 'GET',
      url: '/api/v1/mistakes',
      headers: { 'x-anon-id': anonId },
    });
    const firstBody = firstList.json();
    expect(firstBody.items).toHaveLength(1);
    expect(firstBody.items[0]).toMatchObject({
      taskId: task!.id,
      userAnswer: 'wrong answer',
      correctAnswer: task!.correctAnswer,
      status: 'open',
    });

    await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task!.id}/attempt`,
      headers: { 'x-anon-id': anonId },
      payload: { answer: task!.correctAnswer },
    });

    const secondList = await app.inject({
      method: 'GET',
      url: '/api/v1/mistakes',
      headers: { 'x-anon-id': anonId },
    });
    const secondBody = secondList.json();
    expect(secondBody.items).toHaveLength(1);
    expect(secondBody.items[0].status).toBe('resolved');
    // Still shows the original wrong answer, not the later correct one.
    expect(secondBody.items[0].userAnswer).toBe('wrong answer');
  });

  it("never shows another user's mistakes", async () => {
    const [task] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.taskNumber, 3));
    await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task!.id}/attempt`,
      headers: { 'x-anon-id': randomUUID() },
      payload: { answer: 'wrong' },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/mistakes',
      headers: { 'x-anon-id': randomUUID() },
    });
    expect(res.json().items).toHaveLength(0);
  });
});
