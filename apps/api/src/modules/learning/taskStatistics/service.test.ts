import { randomUUID } from 'node:crypto';
import { schema } from '@zybrilka/db';
import { createImportedTestDb } from '@zybrilka/db/testing';
import { parseMultiPartSpec } from '@zybrilka/shared';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../../app.js';
import { syncSkillsFromCanonicalSolutions } from '../../skills/sync.js';
import * as skillStatsRepo from '../repo.js';
import * as repo from './repo.js';
import { getTaskStatisticsEntry, rebuildTaskStatistics } from './service.js';

/**
 * Never hardcodes a taskNumber — resolves a real task through the DB
 * itself, exactly as ZUBRILKA LEARNING INTELLIGENCE Phase 4 requires:
 * task statistics are keyed by taskId alone, not by taskNumber.
 */
describe('task statistics (ZUBRILKA LEARNING INTELLIGENCE Phase 4)', () => {
  let testDb: Awaited<ReturnType<typeof createImportedTestDb>>;
  let app: ReturnType<typeof buildApp>;

  beforeAll(async () => {
    testDb = await createImportedTestDb();
    await syncSkillsFromCanonicalSolutions(testDb.db);
    app = buildApp({ version: 'test', db: testDb.db });
  });

  afterAll(async () => {
    await app.close();
    await testDb.close();
  });

  let nextTaskWithSkillsIndex = 0;

  /** A fresh task with skills each call, so tests never share mutated state. */
  async function anyTaskWithSkills() {
    const links = await testDb.db
      .selectDistinct({ taskId: schema.taskSkills.taskId })
      .from(schema.taskSkills);
    const link = links[nextTaskWithSkillsIndex % links.length]!;
    nextTaskWithSkillsIndex++;
    const [task] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.id, link.taskId));
    return task!;
  }

  /** Builds a correctly-shaped `answer` payload for any answerType, multi_part included. */
  function correctAnswerPayload(task: typeof schema.tasks.$inferSelect) {
    if (task.answerType === 'multi_part') {
      const spec = parseMultiPartSpec(task.correctAnswer)!;
      const answer: Record<string, string> = {};
      for (const part of spec.parts) answer[part.id] = part.correctAnswer;
      return { answer };
    }
    return { answer: task.correctAnswer };
  }

  /** Same, but deliberately wrong — still shape-valid so the request is graded, not rejected. */
  function wrongAnswerPayload(task: typeof schema.tasks.$inferSelect) {
    if (task.answerType === 'multi_part') {
      const spec = parseMultiPartSpec(task.correctAnswer)!;
      const answer: Record<string, string> = {};
      for (const part of spec.parts) answer[part.id] = '__definitely_wrong__';
      return { answer };
    }
    return { answer: '__definitely_wrong__' };
  }

  it('cold start: a task with no attempts has no statistics row, service returns the null/0 shape', async () => {
    const task = await anyTaskWithSkills();
    const entry = await getTaskStatisticsEntry(testDb.db, task.id);
    expect(entry).toEqual({
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

  it('correct, incorrect, correct -> task_statistics aggregates all three', async () => {
    const task = await anyTaskWithSkills();

    await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task.id}/attempt`,
      headers: { 'x-anon-id': randomUUID() },
      payload: correctAnswerPayload(task),
    });
    await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task.id}/attempt`,
      headers: { 'x-anon-id': randomUUID() },
      payload: wrongAnswerPayload(task),
    });
    await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task.id}/attempt`,
      headers: { 'x-anon-id': randomUUID() },
      payload: correctAnswerPayload(task),
    });

    const entry = await getTaskStatisticsEntry(testDb.db, task.id);
    expect(entry.attempts).toBe(3);
    expect(entry.correctAttempts).toBe(2);
    expect(entry.incorrectAttempts).toBe(1);
    expect(entry.accuracy).toBe(67);
    expect(entry.difficulty).not.toBeNull();
    expect(entry.confidence).toBeGreaterThan(0);
    expect(entry.lastAttemptAt).not.toBeNull();
  });

  it('one attempt updates task_statistics AND user_skill_statistics together, in one transaction', async () => {
    const task = await anyTaskWithSkills();
    const anonId = randomUUID();

    const before = await repo.getTaskStatistics(testDb.db, task.id);
    expect(before).toBeUndefined();

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task.id}/attempt`,
      headers: { 'x-anon-id': anonId },
      payload: correctAnswerPayload(task),
    });
    expect(res.statusCode).toBe(200);

    const taskStats = await repo.getTaskStatistics(testDb.db, task.id);
    expect(taskStats).toBeDefined();
    expect(taskStats!.attempts).toBe(1);

    const skillIds = await testDb.db
      .select({ skillId: schema.taskSkills.skillId })
      .from(schema.taskSkills)
      .where(eq(schema.taskSkills.taskId, task.id));
    for (const { skillId } of skillIds) {
      const skillStats = await skillStatsRepo.getUserSkillStatisticsForSkill(
        testDb.db,
        anonId,
        skillId,
      );
      expect(skillStats).toBeDefined();
      expect(skillStats!.attempts).toBe(1);
    }
  });

  describe('rebuildTaskStatistics', () => {
    it('rebuilds identical statistics from historical attempts after a clean wipe', async () => {
      const task = await anyTaskWithSkills();
      await app.inject({
        method: 'POST',
        url: `/api/v1/tasks/${task.id}/attempt`,
        headers: { 'x-anon-id': randomUUID() },
        payload: correctAnswerPayload(task),
      });
      await app.inject({
        method: 'POST',
        url: `/api/v1/tasks/${task.id}/attempt`,
        headers: { 'x-anon-id': randomUUID() },
        payload: wrongAnswerPayload(task),
      });

      const before = await repo.getTaskStatistics(testDb.db, task.id);
      expect(before).toBeDefined();

      await repo.deleteTaskStatistics(testDb.db, task.id);
      expect(await repo.getTaskStatistics(testDb.db, task.id)).toBeUndefined();

      const result = await rebuildTaskStatistics(testDb.db);
      expect(result.tasksUpdated).toBeGreaterThan(0);

      const after = await repo.getTaskStatistics(testDb.db, task.id);
      expect(after).toEqual(before);
    });

    it('running rebuild twice in a row is idempotent', async () => {
      const task = await anyTaskWithSkills();
      await app.inject({
        method: 'POST',
        url: `/api/v1/tasks/${task.id}/attempt`,
        headers: { 'x-anon-id': randomUUID() },
        payload: correctAnswerPayload(task),
      });

      const first = await rebuildTaskStatistics(testDb.db);
      const firstRow = await repo.getTaskStatistics(testDb.db, task.id);
      const second = await rebuildTaskStatistics(testDb.db);
      const secondRow = await repo.getTaskStatistics(testDb.db, task.id);

      expect(second.tasksUpdated).toBe(first.tasksUpdated);
      expect(secondRow).toEqual(firstRow);
    });

    it('does not create duplicate rows on repeated rebuilds', async () => {
      const task = await anyTaskWithSkills();
      await app.inject({
        method: 'POST',
        url: `/api/v1/tasks/${task.id}/attempt`,
        headers: { 'x-anon-id': randomUUID() },
        payload: correctAnswerPayload(task),
      });

      await rebuildTaskStatistics(testDb.db);
      await rebuildTaskStatistics(testDb.db);

      const rows = await testDb.db
        .select()
        .from(schema.taskStatistics)
        .where(eq(schema.taskStatistics.taskId, task.id));
      expect(rows).toHaveLength(1);
    });
  });
});
