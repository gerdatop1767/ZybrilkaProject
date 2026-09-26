import { randomUUID } from 'node:crypto';
import { schema } from '@zybrilka/db';
import { createSeededTestDb } from '@zybrilka/db/testing';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../app.js';

describe('GET /api/v1/progress/summary', () => {
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
    const res = await app.inject({ method: 'GET', url: '/api/v1/progress/summary' });
    expect(res.statusCode).toBe(400);
  });

  it('is computed from real attempts, not hardcoded', async () => {
    const tasks = await testDb.db.select().from(schema.tasks).where(eq(schema.tasks.taskNumber, 1));
    const anonId = randomUUID();

    // One correct, one wrong.
    await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${tasks[0]!.id}/attempt`,
      headers: { 'x-anon-id': anonId },
      payload: { answer: tasks[0]!.correctAnswer },
    });
    await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${tasks[1]!.id}/attempt`,
      headers: { 'x-anon-id': anonId },
      payload: { answer: 'wrong' },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/progress/summary',
      headers: { 'x-anon-id': anonId },
    });
    const body = res.json();

    expect(body.solvedTotal).toBe(2);
    expect(body.correctTotal).toBe(1);
    expect(body.incorrectTotal).toBe(1);
    expect(body.accuracyPercent).toBe(50);

    const mathRow = body.bySubject.find((s: { subjectId: string }) => s.subjectId === 'math');
    expect(mathRow).toMatchObject({ solved: 2, correct: 1 });

    const numberRow = body.byTaskNumber.find((n: { taskNumber: number }) => n.taskNumber === 1);
    expect(numberRow).toMatchObject({ solved: 2, correct: 1 });
  });

  it('starts at zero for a brand-new user', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/progress/summary',
      headers: { 'x-anon-id': randomUUID() },
    });
    expect(res.json()).toMatchObject({ solvedTotal: 0, correctTotal: 0, accuracyPercent: 0 });
  });
});
