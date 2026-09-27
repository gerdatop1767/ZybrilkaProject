import { randomUUID } from 'node:crypto';
import { schema } from '@zybrilka/db';
import { createImportedTestDb } from '@zybrilka/db/testing';
import { and, eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../app.js';

/**
 * S3 / S3.1 — proves the real EGE-2026 Вариант 1 import (not just the
 * demo seed) flows through the exact same Task Engine as everything
 * else: GET /tasks(/:id)/random, POST /attempt, mistake creation, and
 * that tasks 15 (interval) and 19 (multi_part) — needs_review in S3,
 * published after S3.1 added those answer types — are now fully
 * gradeable through the public API like any other task.
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

  it('task 15 (interval) and task 19 (multi_part) are published and listed, not needs_review', async () => {
    for (const taskNumber of [15, 19]) {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/tasks?subject=math&taskNumber=${taskNumber}`,
      });
      const body = res.json();
      const variantTask = body.items.find(
        (t: { source: string }) => t.source === 'Ященко ЕГЭ 2026. Типовые экзаменационные варианты',
      );
      expect(variantTask).toBeDefined();
    }
  });

  it('task 15 grades an equivalent interval notation as correct', async () => {
    const [task15] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(and(eq(schema.tasks.subjectId, 'math'), eq(schema.tasks.taskNumber, 15)));
    expect(task15!.answerType).toBe('interval');

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task15!.id}/attempt`,
      headers: { 'x-anon-id': randomUUID() },
      payload: { answer: '(log_5(2),log_5(8)) U (log_5(8),log_3(8)]' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().correct).toBe(true);
  });

  it('task 19 grades a partially-correct multi_part attempt and records the wrong part on the mistake', async () => {
    const [task19] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(and(eq(schema.tasks.subjectId, 'math'), eq(schema.tasks.taskNumber, 19)));
    expect(task19!.answerType).toBe('multi_part');
    const anonId = randomUUID();

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task19!.id}/attempt`,
      headers: { 'x-anon-id': anonId },
      payload: { answer: { a: 'нет', b: '607', c: 'wrong' } },
    });
    const body = res.json();
    expect(body.correct).toBe(false);
    expect(body.partStatus).toBe('partially_correct');
    expect(body.correctParts).toBe(2);

    const [mistake] = await testDb.db
      .select()
      .from(schema.mistakes)
      .where(and(eq(schema.mistakes.userId, anonId), eq(schema.mistakes.taskId, task19!.id)));
    expect(mistake?.wrongParts).toEqual(['c']);
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
