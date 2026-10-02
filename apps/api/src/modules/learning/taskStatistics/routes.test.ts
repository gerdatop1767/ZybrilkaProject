import { randomUUID } from 'node:crypto';
import { schema } from '@zybrilka/db';
import { createImportedTestDb } from '@zybrilka/db/testing';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../../app.js';

describe('GET /tasks/:taskId/statistics (ZUBRILKA LEARNING INTELLIGENCE Phase 4)', () => {
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

  async function anyRealTask() {
    const [task] = await testDb.db.select().from(schema.tasks).limit(1);
    return task!;
  }

  it('404s for a task id that does not exist', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/tasks/${randomUUID()}/statistics`,
    });
    expect(res.statusCode).toBe(404);
  });

  it('400s for a malformed id', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/tasks/not-a-uuid/statistics' });
    expect(res.statusCode).toBe(400);
  });

  it('returns the cold-start shape for an existing task with no attempts yet', async () => {
    const task = await anyRealTask();
    const res = await app.inject({ method: 'GET', url: `/api/v1/tasks/${task.id}/statistics` });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      taskId: task.id,
      attempts: 0,
      correctAttempts: 0,
      incorrectAttempts: 0,
      accuracy: null,
      difficulty: null,
      confidence: 0,
      averageTimeMs: null,
      lastAttemptAt: null,
    });
  });

  it('returns real aggregated statistics once attempts exist, same for every requester (no user scoping)', async () => {
    const [task] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.taskNumber, 2));

    await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task!.id}/attempt`,
      headers: { 'x-anon-id': randomUUID() },
      payload: { answer: task!.correctAnswer },
    });

    const resAsUserA = await app.inject({
      method: 'GET',
      url: `/api/v1/tasks/${task!.id}/statistics`,
      headers: { 'x-anon-id': randomUUID() },
    });
    const resAsUserB = await app.inject({
      method: 'GET',
      url: `/api/v1/tasks/${task!.id}/statistics`,
      headers: { 'x-anon-id': randomUUID() },
    });
    const resNoAnon = await app.inject({
      method: 'GET',
      url: `/api/v1/tasks/${task!.id}/statistics`,
    });

    expect(resAsUserA.json()).toEqual(resAsUserB.json());
    expect(resAsUserA.json()).toEqual(resNoAnon.json());
    expect(resAsUserA.json().attempts).toBe(1);
  });

  it('exposes no mutation endpoint for task statistics (GET only)', async () => {
    const task = await anyRealTask();
    const putRes = await app.inject({
      method: 'PUT',
      url: `/api/v1/tasks/${task.id}/statistics`,
      payload: {},
    });
    expect(putRes.statusCode).toBe(404);
    const postRes = await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task.id}/statistics`,
      payload: {},
    });
    expect(postRes.statusCode).toBe(404);
  });
});
