import { randomUUID } from 'node:crypto';
import { schema } from '@zybrilka/db';
import { createSeededTestDb } from '@zybrilka/db/testing';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../app.js';

describe('tasks routes', () => {
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

  it('GET /api/v1/tasks lists published tasks without the answer or explanation', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/tasks?subject=math' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.items.length).toBeGreaterThan(0);
    for (const item of body.items) {
      expect(item).not.toHaveProperty('correctAnswer');
      expect(item).not.toHaveProperty('explanationMd');
    }
  });

  it('filters by taskNumber', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/tasks?subject=math&taskNumber=3' });
    const body = res.json();
    expect(body.items.length).toBeGreaterThan(0);
    for (const item of body.items) {
      expect(item.taskNumber).toBe(3);
    }
  });

  it('GET /api/v1/tasks/:id returns 404 for an unknown id', async () => {
    const res = await app.inject({ method: 'GET', url: `/api/v1/tasks/${randomUUID()}` });
    expect(res.statusCode).toBe(404);
  });

  it('GET /api/v1/tasks/:id never includes the answer before an attempt exists', async () => {
    const [task] = await testDb.db.select().from(schema.tasks).limit(1);
    const res = await app.inject({ method: 'GET', url: `/api/v1/tasks/${task!.id}` });
    expect(res.statusCode).toBe(200);
    expect(res.json()).not.toHaveProperty('correctAnswer');
  });

  it('GET /api/v1/tasks/random respects filters and returns a task without the answer', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/tasks/random?subject=math&taskNumber=1',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.taskNumber).toBe(1);
    expect(body).not.toHaveProperty('correctAnswer');
  });

  it('GET /api/v1/tasks/random 404s when nothing matches', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/tasks/random?subject=does-not-exist',
    });
    expect(res.statusCode).toBe(404);
  });

  describe('POST /api/v1/tasks/:id/attempt', () => {
    it('requires an x-anon-id header', async () => {
      const [task] = await testDb.db.select().from(schema.tasks).limit(1);
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/tasks/${task!.id}/attempt`,
        payload: { answer: '4' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('grades server-side and ignores a client-supplied "correct" flag', async () => {
      const [task] = await testDb.db
        .select()
        .from(schema.tasks)
        .where(eq(schema.tasks.taskNumber, 1));
      const anonId = randomUUID();

      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/tasks/${task!.id}/attempt`,
        headers: { 'x-anon-id': anonId },
        // A malicious client claiming correct:true for a wrong answer.
        payload: { answer: 'definitely wrong', correct: true },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.correct).toBe(false);
      expect(body.correctAnswer).toBe(task!.correctAnswer);
      expect(body.mistakeId).not.toBeNull();
    });

    it('records a correct attempt with no mistake', async () => {
      const [task] = await testDb.db
        .select()
        .from(schema.tasks)
        .where(eq(schema.tasks.taskNumber, 5));
      const anonId = randomUUID();

      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/tasks/${task!.id}/attempt`,
        headers: { 'x-anon-id': anonId },
        payload: { answer: task!.correctAnswer },
      });

      const body = res.json();
      expect(body.correct).toBe(true);
      expect(body.mistakeId).toBeNull();
    });

    it('a repeated wrong answer increments the mistake, and history is never deleted', async () => {
      const [task] = await testDb.db
        .select()
        .from(schema.tasks)
        .where(eq(schema.tasks.taskNumber, 2));
      const anonId = randomUUID();

      await app.inject({
        method: 'POST',
        url: `/api/v1/tasks/${task!.id}/attempt`,
        headers: { 'x-anon-id': anonId },
        payload: { answer: 'wrong once' },
      });
      const second = await app.inject({
        method: 'POST',
        url: `/api/v1/tasks/${task!.id}/attempt`,
        headers: { 'x-anon-id': anonId },
        payload: { answer: 'wrong twice' },
      });
      expect(second.json().correct).toBe(false);

      const [mistake] = await testDb.db
        .select()
        .from(schema.mistakes)
        .where(eq(schema.mistakes.taskId, task!.id));
      expect(mistake?.timesWrong).toBe(2);
      expect(mistake?.status).toBe('open');

      const allAttempts = await testDb.db
        .select()
        .from(schema.attempts)
        .where(eq(schema.attempts.taskId, task!.id));
      expect(allAttempts.length).toBe(2);
    });

    it('resolves a mistake on a later correct attempt without deleting attempt history', async () => {
      const [task] = await testDb.db
        .select()
        .from(schema.tasks)
        .where(eq(schema.tasks.taskNumber, 4));
      const anonId = randomUUID();

      await app.inject({
        method: 'POST',
        url: `/api/v1/tasks/${task!.id}/attempt`,
        headers: { 'x-anon-id': anonId },
        payload: { answer: 'nope' },
      });
      await app.inject({
        method: 'POST',
        url: `/api/v1/tasks/${task!.id}/attempt`,
        headers: { 'x-anon-id': anonId },
        payload: { answer: task!.correctAnswer },
      });

      const [mistake] = await testDb.db
        .select()
        .from(schema.mistakes)
        .where(eq(schema.mistakes.taskId, task!.id));
      expect(mistake?.status).toBe('resolved');
      expect(mistake?.timesWrong).toBe(1);

      const allAttempts = await testDb.db
        .select()
        .from(schema.attempts)
        .where(eq(schema.attempts.taskId, task!.id));
      expect(allAttempts.length).toBe(2);
    });

    it('includes the answer and explanation once an attempt has been made', async () => {
      const [task] = await testDb.db
        .select()
        .from(schema.tasks)
        .where(eq(schema.tasks.taskNumber, 1))
        .limit(1);
      const anonId = randomUUID();

      await app.inject({
        method: 'POST',
        url: `/api/v1/tasks/${task!.id}/attempt`,
        headers: { 'x-anon-id': anonId },
        payload: { answer: task!.correctAnswer },
      });

      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/tasks/${task!.id}`,
        headers: { 'x-anon-id': anonId },
      });
      const body = res.json();
      expect(body.correctAnswer).toBe(task!.correctAnswer);
      expect(body.explanationMd).toBe(task!.explanationMd);
    });

    it('returns 404 attempting a task that does not exist', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/tasks/${randomUUID()}/attempt`,
        headers: { 'x-anon-id': randomUUID() },
        payload: { answer: '1' },
      });
      expect(res.statusCode).toBe(404);
    });

    it('rejects an invalid x-anon-id header the same as a missing one', async () => {
      const [task] = await testDb.db.select().from(schema.tasks).limit(1);
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/tasks/${task!.id}/attempt`,
        headers: { 'x-anon-id': 'not-a-uuid' },
        payload: { answer: '1' },
      });
      expect(res.statusCode).toBe(400);
    });
  });
});
