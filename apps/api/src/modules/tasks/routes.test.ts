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

  it('GET /api/v1/tasks/random respects a topic filter', async () => {
    const [task] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.status, 'published'))
      .limit(1);
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/tasks/random?topic=${task!.topicId}`,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().topicId).toBe(task!.topicId);
  });

  it('GET /api/v1/tasks/random 404s for a topic with no published tasks', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/tasks/random?topic=${randomUUID()}`,
    });
    expect(res.statusCode).toBe(404);
  });

  describe('GET /api/v1/tasks/random?unseen=true (Training "Не встречавшиеся")', () => {
    it('requires x-anon-id', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/tasks/random?subject=math&taskNumber=1&unseen=true',
      });
      expect(res.statusCode).toBe(400);
      expect(res.json()).toEqual({ error: 'missing_anon_id' });
    });

    it('never returns a task the user already has an attempt on, across repeated calls', async () => {
      const anonId = randomUUID();
      const seen = new Set<string>();
      // The seed has exactly 2 published tasks under subject=math,
      // taskNumber=1 — draining the unseen pool one real attempt at a
      // time proves this is a real server-side filter, not luck.
      for (let i = 0; i < 2; i += 1) {
        const res = await app.inject({
          method: 'GET',
          url: '/api/v1/tasks/random?subject=math&taskNumber=1&unseen=true',
          headers: { 'x-anon-id': anonId },
        });
        expect(res.statusCode).toBe(200);
        const task = res.json();
        expect(seen.has(task.id)).toBe(false); // no duplicates
        seen.add(task.id);
        await app.inject({
          method: 'POST',
          url: `/api/v1/tasks/${task.id}/attempt`,
          headers: { 'x-anon-id': anonId },
          payload: { answer: 'definitely wrong' },
        });
      }
      expect(seen.size).toBe(2);
    });

    it('returns a controlled 404 "no_unseen_tasks" once every task of that number is attempted — never a fallback to a seen one', async () => {
      const anonId = randomUUID();
      for (let i = 0; i < 2; i += 1) {
        const res = await app.inject({
          method: 'GET',
          url: '/api/v1/tasks/random?subject=math&taskNumber=1&unseen=true',
          headers: { 'x-anon-id': anonId },
        });
        const task = res.json();
        await app.inject({
          method: 'POST',
          url: `/api/v1/tasks/${task.id}/attempt`,
          headers: { 'x-anon-id': anonId },
          payload: { answer: 'definitely wrong' },
        });
      }
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/tasks/random?subject=math&taskNumber=1&unseen=true',
        headers: { 'x-anon-id': anonId },
      });
      expect(res.statusCode).toBe(404);
      expect(res.json()).toEqual({ error: 'no_unseen_tasks' });
    });

    it('works generically for an arbitrary taskNumber, never hardcoded to one number', async () => {
      const anonId = randomUUID();
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/tasks/random?subject=math&taskNumber=4&unseen=true',
        headers: { 'x-anon-id': anonId },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().taskNumber).toBe(4);
    });

    it('without unseen, an already-attempted task can still be returned (default/"Обычные" behavior unchanged)', async () => {
      const anonId = randomUUID();
      const [task] = await testDb.db
        .select()
        .from(schema.tasks)
        .where(eq(schema.tasks.taskNumber, 3));
      await app.inject({
        method: 'POST',
        url: `/api/v1/tasks/${task!.id}/attempt`,
        headers: { 'x-anon-id': anonId },
        payload: { answer: 'definitely wrong' },
      });
      // No `unseen` param — repeated random picks may legitimately
      // include the already-attempted task, so this only asserts the
      // request itself isn't rejected/filtered.
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/tasks/random?subject=math&taskNumber=3',
        headers: { 'x-anon-id': anonId },
      });
      expect(res.statusCode).toBe(200);
    });
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
