import { randomUUID } from 'node:crypto';
import { schema } from '@zybrilka/db';
import { createImportedTestDb } from '@zybrilka/db/testing';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../../app.js';

describe('GET /me/learning/errors (ZUBRILKA LEARNING INTELLIGENCE Phase 5)', () => {
  let testDb: Awaited<ReturnType<typeof createImportedTestDb>>;
  let app: ReturnType<typeof buildApp>;

  beforeAll(async () => {
    testDb = await createImportedTestDb();
    app = buildApp({ version: 'test', db: testDb.db });
  });

  afterAll(async () => {
    await app.close();
    await testDb.close();
  });

  async function anyShortAnswerTask() {
    const [task] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.answerType, 'short_answer'))
      .limit(1);
    return task!;
  }

  it('requires an x-anon-id header', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/me/learning/errors' });
    expect(res.statusCode).toBe(400);
  });

  it('a brand-new user gets an empty items array, not an error', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/me/learning/errors',
      headers: { 'x-anon-id': randomUUID() },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ items: [] });
  });

  it('a wrong attempt is reflected; a correct one does not add anything', async () => {
    const task = await anyShortAnswerTask();
    const anonId = randomUUID();

    await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task.id}/attempt`,
      headers: { 'x-anon-id': anonId },
      payload: { answer: '__wrong__' },
    });
    await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task.id}/attempt`,
      headers: { 'x-anon-id': anonId },
      payload: { answer: task.correctAnswer },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/me/learning/errors',
      headers: { 'x-anon-id': anonId },
    });
    const body = res.json();
    expect(body.items).toEqual([
      { errorSignature: 'incorrect_answer', count: 1, lastOccurredAt: expect.any(String) },
    ]);
  });

  it("never leaks one user's errors to another", async () => {
    const task = await anyShortAnswerTask();
    const userOne = randomUUID();
    const userTwo = randomUUID();

    await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task.id}/attempt`,
      headers: { 'x-anon-id': userOne },
      payload: { answer: '__wrong__' },
    });

    const userTwoRes = await app.inject({
      method: 'GET',
      url: '/api/v1/me/learning/errors',
      headers: { 'x-anon-id': userTwo },
    });
    expect(userTwoRes.json()).toEqual({ items: [] });
  });

  it("there is no way to request another user's errors via query — userId always comes from the server-resolved anon header", async () => {
    const task = await anyShortAnswerTask();
    const victim = randomUUID();
    const attacker = randomUUID();

    await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task.id}/attempt`,
      headers: { 'x-anon-id': victim },
      payload: { answer: '__wrong__' },
    });

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/me/learning/errors?userId=${victim}`,
      headers: { 'x-anon-id': attacker },
    });
    expect(res.json()).toEqual({ items: [] });
  });
});
