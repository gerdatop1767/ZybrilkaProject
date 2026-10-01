import { randomUUID } from 'node:crypto';
import { schema } from '@zybrilka/db';
import { createImportedTestDb } from '@zybrilka/db/testing';
import { parseMultiPartSpec } from '@zybrilka/shared';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../../app.js';
import * as repo from './repo.js';
import { rebuildUserErrorStatistics } from './service.js';

/**
 * Never hardcodes a taskNumber — resolves real tasks by answerType
 * through the DB itself, matching ZUBRILKA LEARNING INTELLIGENCE's
 * "no taskNumber branching" rule.
 */
describe('error signatures (ZUBRILKA LEARNING INTELLIGENCE Phase 5)', () => {
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

  async function anyIntervalTask() {
    const [task] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.answerType, 'interval'))
      .limit(1);
    return task;
  }

  async function anyMultiPartTask() {
    const [task] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.answerType, 'multi_part'))
      .limit(1);
    return task;
  }

  it('a correct answer records no error signatures', async () => {
    const task = await anyShortAnswerTask();
    const anonId = randomUUID();

    await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task.id}/attempt`,
      headers: { 'x-anon-id': anonId },
      payload: { answer: task.correctAnswer },
    });

    const stats = await repo.getUserErrorStatistics(testDb.db, anonId);
    expect(stats).toEqual([]);
  });

  it('a wrong short_answer records incorrect_answer', async () => {
    const task = await anyShortAnswerTask();
    const anonId = randomUUID();

    await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task.id}/attempt`,
      headers: { 'x-anon-id': anonId },
      payload: { answer: '__definitely_wrong__' },
    });

    const stats = await repo.getUserErrorStatistics(testDb.db, anonId);
    expect(stats).toEqual([
      expect.objectContaining({ errorSignature: 'incorrect_answer', count: 1 }),
    ]);
  });

  it('a blank short_answer records blank_answer, not incorrect_answer', async () => {
    const task = await anyShortAnswerTask();
    const anonId = randomUUID();

    await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task.id}/attempt`,
      headers: { 'x-anon-id': anonId },
      payload: { answer: '   ' },
    });

    const stats = await repo.getUserErrorStatistics(testDb.db, anonId);
    expect(stats).toEqual([expect.objectContaining({ errorSignature: 'blank_answer', count: 1 })]);
  });

  it('repeating the same wrong answer increments the count', async () => {
    const task = await anyShortAnswerTask();
    const anonId = randomUUID();

    for (let i = 0; i < 3; i++) {
      await app.inject({
        method: 'POST',
        url: `/api/v1/tasks/${task.id}/attempt`,
        headers: { 'x-anon-id': anonId },
        payload: { answer: '__wrong__' },
      });
    }

    const stats = await repo.getUserErrorStatistics(testDb.db, anonId);
    expect(stats).toEqual([
      expect.objectContaining({ errorSignature: 'incorrect_answer', count: 3 }),
    ]);
  });

  it('never mixes error statistics between two different users', async () => {
    const task = await anyShortAnswerTask();
    const userOne = randomUUID();
    const userTwo = randomUUID();

    await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task.id}/attempt`,
      headers: { 'x-anon-id': userOne },
      payload: { answer: '__wrong__' },
    });

    const userTwoStats = await repo.getUserErrorStatistics(testDb.db, userTwo);
    expect(userTwoStats).toEqual([]);
  });

  it('an unparseable interval answer records format_error', async () => {
    const task = await anyIntervalTask();
    if (!task) return; // no interval task in the imported fixture — skip rather than fabricate one
    const anonId = randomUUID();

    await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task.id}/attempt`,
      headers: { 'x-anon-id': anonId },
      payload: { answer: 'not an interval at all' },
    });

    const stats = await repo.getUserErrorStatistics(testDb.db, anonId);
    expect(stats).toEqual([expect.objectContaining({ errorSignature: 'format_error', count: 1 })]);
  });

  it('a multi_part attempt with one wrong part records partially_correct + part_incorrect:<id>', async () => {
    const task = await anyMultiPartTask();
    if (!task) return;
    const anonId = randomUUID();

    const spec = parseMultiPartSpec(task.correctAnswer)!;
    const answer: Record<string, string> = {};
    spec.parts.forEach((part, i) => {
      answer[part.id] = i === 0 ? '__wrong__' : part.correctAnswer;
    });

    await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task.id}/attempt`,
      headers: { 'x-anon-id': anonId },
      payload: { answer },
    });

    const stats = await repo.getUserErrorStatistics(testDb.db, anonId);
    const codes = stats.map((s) => s.errorSignature).sort();
    expect(codes).toEqual([`part_incorrect:${spec.parts[0]!.id}`, 'partially_correct'].sort());
  });

  describe('rebuildUserErrorStatistics', () => {
    it('rebuilds identical statistics from historical attempts after a clean wipe', async () => {
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
        payload: { answer: '   ' },
      });

      const before = await repo.getUserErrorStatistics(testDb.db, anonId);
      expect(before.length).toBeGreaterThan(0);

      await repo.deleteUserErrorStatistics(testDb.db, anonId);
      expect(await repo.getUserErrorStatistics(testDb.db, anonId)).toEqual([]);

      const result = await rebuildUserErrorStatistics(testDb.db, anonId);
      expect(result.signaturesRecorded).toBeGreaterThan(0);

      const after = await repo.getUserErrorStatistics(testDb.db, anonId);
      const sortByCode = (rows: typeof after) =>
        [...rows].sort((a, b) => a.errorSignature.localeCompare(b.errorSignature));
      expect(sortByCode(after)).toEqual(sortByCode(before));
    });

    it('running rebuild twice in a row is idempotent', async () => {
      const task = await anyShortAnswerTask();
      const anonId = randomUUID();
      await app.inject({
        method: 'POST',
        url: `/api/v1/tasks/${task.id}/attempt`,
        headers: { 'x-anon-id': anonId },
        payload: { answer: '__wrong__' },
      });

      const first = await rebuildUserErrorStatistics(testDb.db, anonId);
      const firstRows = await repo.getUserErrorStatistics(testDb.db, anonId);
      const second = await rebuildUserErrorStatistics(testDb.db, anonId);
      const secondRows = await repo.getUserErrorStatistics(testDb.db, anonId);

      expect(second.signaturesRecorded).toBe(first.signaturesRecorded);
      expect(secondRows).toEqual(firstRows);
    });

    it('does not create duplicate rows on repeated rebuilds', async () => {
      const task = await anyShortAnswerTask();
      const anonId = randomUUID();
      await app.inject({
        method: 'POST',
        url: `/api/v1/tasks/${task.id}/attempt`,
        headers: { 'x-anon-id': anonId },
        payload: { answer: '__wrong__' },
      });

      await rebuildUserErrorStatistics(testDb.db, anonId);
      await rebuildUserErrorStatistics(testDb.db, anonId);

      const rows = await testDb.db
        .select()
        .from(schema.userErrorStatistics)
        .where(eq(schema.userErrorStatistics.userId, anonId));
      const uniqueSignatures = new Set(rows.map((r) => r.errorSignature));
      expect(rows).toHaveLength(uniqueSignatures.size);
    });
  });
});
