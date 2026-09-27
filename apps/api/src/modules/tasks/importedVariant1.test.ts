import { randomUUID } from 'node:crypto';
import { schema } from '@zybrilka/db';
import { createImportedTestDb } from '@zybrilka/db/testing';
import { and, eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../app.js';

/**
 * S3 — proves the real EGE-2026 Вариант 1 import (not just the demo
 * seed) flows through the exact same Task Engine as everything else:
 * GET /tasks(/:id)/random, POST /attempt, mistake creation, and —
 * critically — that 'needs_review' tasks (unverified answer format)
 * are never reachable through the public list/random endpoints.
 */
describe('imported EGE-2026 Variant 1 tasks via the real Task Engine', () => {
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

  it('a published imported task (task 1) is listed and never leaks its answer before an attempt', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/tasks?subject=math&taskNumber=1' });
    const body = res.json();
    const variantTask = body.items.find(
      (t: { source: string }) => t.source === 'Ященко ЕГЭ 2026. Типовые экзаменационные варианты',
    );
    expect(variantTask).toBeDefined();
    expect(variantTask).not.toHaveProperty('correctAnswer');
  });

  it('needs_review tasks (15 and 19) never appear in the public list, even filtered by their own number', async () => {
    for (const taskNumber of [15, 19]) {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/tasks?subject=math&taskNumber=${taskNumber}`,
      });
      const body = res.json();
      const leaked = body.items.some(
        (t: { source: string }) => t.source === 'Ященко ЕГЭ 2026. Типовые экзаменационные варианты',
      );
      expect(leaked).toBe(false);
    }
  });

  it('needs_review tasks are never returned by GET /tasks/random for their task number', async () => {
    for (const taskNumber of [15, 19]) {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/tasks/random?subject=math&taskNumber=${taskNumber}`,
      });
      // Only the demo-seeded tasks (numbers 1-5) exist as 'published' for
      // most numbers; 15/19 have no published row at all in this import,
      // so random must 404 rather than ever surface the needs_review row.
      expect(res.statusCode).toBe(404);
    }
  });

  it('a real imported task carries its graph image through the API', async () => {
    const [task8] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(and(eq(schema.tasks.subjectId, 'math'), eq(schema.tasks.taskNumber, 8)));
    const res = await app.inject({ method: 'GET', url: `/api/v1/tasks/${task8!.id}` });
    expect(res.json().imageUrl).toBe('/tasks/imports/ege-2026-variant-1/task-08-graph.png');
  });

  it('server-checks an imported task correctly end to end: attempt, mistake, and explanation release', async () => {
    const [task7] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(and(eq(schema.tasks.subjectId, 'math'), eq(schema.tasks.taskNumber, 7)));
    const anonId = randomUUID();

    const wrong = await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task7!.id}/attempt`,
      headers: { 'x-anon-id': anonId },
      payload: { answer: '0' },
    });
    expect(wrong.json()).toMatchObject({ correct: false, correctAnswer: '-71' });
    expect(wrong.json().mistakeId).not.toBeNull();

    const mistakes = await app.inject({
      method: 'GET',
      url: '/api/v1/mistakes',
      headers: { 'x-anon-id': anonId },
    });
    expect(mistakes.json().items[0]).toMatchObject({ taskId: task7!.id, status: 'open' });

    const correct = await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task7!.id}/attempt`,
      headers: { 'x-anon-id': anonId },
      payload: { answer: '-71' },
    });
    expect(correct.json().correct).toBe(true);

    const withSolution = await app.inject({
      method: 'GET',
      url: `/api/v1/tasks/${task7!.id}`,
      headers: { 'x-anon-id': anonId },
    });
    expect(withSolution.json().explanationMd).toContain('Ответ: −71.');
  });
});
