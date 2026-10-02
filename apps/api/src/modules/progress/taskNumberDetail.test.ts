import { randomUUID } from 'node:crypto';
import { schema } from '@zybrilka/db';
import { createImportedTestDb } from '@zybrilka/db/testing';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../app.js';
import { syncSkillsFromCanonicalSolutions } from '../skills/sync.js';

/**
 * Statistics 2.0 — GET /progress/by-task-number/:taskNumber/detail.
 * Uses the real imported EGE Variant 1 bank + a real skill sync (same
 * precedent as `modules/learning/service.test.ts`) so skill-breakdown
 * assertions exercise real `task_skills` links, never invented ones.
 */
describe('GET /api/v1/progress/by-task-number/:taskNumber/detail', () => {
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

  async function detail(anonId: string, taskNumber: number, subject = 'math') {
    return app.inject({
      method: 'GET',
      url: `/api/v1/progress/by-task-number/${taskNumber}/detail?subject=${subject}`,
      headers: { 'x-anon-id': anonId },
    });
  }

  it('requires an x-anon-id header', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/progress/by-task-number/5/detail?subject=math',
    });
    expect(res.statusCode).toBe(400);
  });

  it('requires a subject query param', async () => {
    const anonId = randomUUID();
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/progress/by-task-number/5/detail',
      headers: { 'x-anon-id': anonId },
    });
    expect(res.statusCode).toBe(400);
  });

  it('cold start: zero attempts reports real nulls, never a fabricated 0%', async () => {
    const anonId = randomUUID();
    const res = await detail(anonId, 7);
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.attempts).toBe(0);
    expect(body.uniqueTasksAttempted).toBe(0);
    expect(body.accuracy).toBeNull();
    expect(body.averageTimeMs).toBeNull();
    expect(body.medianTimeMs).toBeNull();
    expect(body.lastAttemptAt).toBeNull();
    expect(body.recentAccuracy).toBeNull();
    expect(body.previousAccuracy).toBeNull();
    expect(body.speedSignal.value).toBeNull();
    expect(body.errorBreakdown).toEqual([]);
  });

  it('correct/incorrect, unique tasks (distinct from attempts), and accuracy', async () => {
    const anonId = randomUUID();
    const [task] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.taskNumber, 5));

    // Same task solved wrong then right: 2 attempts, 1 unique task.
    await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task!.id}/attempt`,
      headers: { 'x-anon-id': anonId },
      payload: { answer: 'definitely wrong' },
    });
    await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task!.id}/attempt`,
      headers: { 'x-anon-id': anonId },
      payload: { answer: task!.correctAnswer },
    });

    const res = await detail(anonId, 5);
    const body = res.json();
    expect(body.attempts).toBe(2);
    expect(body.uniqueTasksAttempted).toBe(1);
    expect(body.correctAttempts).toBe(1);
    expect(body.incorrectAttempts).toBe(1);
    expect(body.accuracy).toBe(50);
    expect(body.lastAttemptAt).not.toBeNull();
  });

  it('average/median time counts only timed attempts; untimed never counts as 0', async () => {
    const anonId = randomUUID();
    const [task] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.taskNumber, 6));

    await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task!.id}/attempt`,
      headers: { 'x-anon-id': anonId },
      payload: { answer: 'wrong', timeSpentMs: 10000 },
    });
    await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task!.id}/attempt`,
      headers: { 'x-anon-id': anonId },
      payload: { answer: 'wrong again' }, // untimed
    });
    await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task!.id}/attempt`,
      headers: { 'x-anon-id': anonId },
      payload: { answer: 'wrong third', timeSpentMs: 30000 },
    });

    const res = await detail(anonId, 6);
    const body = res.json();
    expect(body.attempts).toBe(3);
    expect(body.timedAttempts).toBe(2);
    expect(body.averageTimeMs).toBe(20000);
    expect(body.medianTimeMs).toBe(20000);
  });

  it('errorBreakdown reflects real detected signatures scoped to this task number only', async () => {
    const anonId = randomUUID();
    const [task8] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.taskNumber, 8));
    const [task9] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.taskNumber, 9));

    // Two blank answers on #8, one blank on #9 — #9 must not leak into #8's breakdown.
    await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task8!.id}/attempt`,
      headers: { 'x-anon-id': anonId },
      payload: { answer: '   ' },
    });
    await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task9!.id}/attempt`,
      headers: { 'x-anon-id': anonId },
      payload: { answer: '   ' },
    });

    const res = await detail(anonId, 8);
    const body = res.json();
    expect(body.errorBreakdown).toEqual([{ signature: 'blank_answer', count: 1 }]);
  });

  it('multipart wrong-part signatures are reported with their partId', async () => {
    const [multiPartTask] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.answerType, 'multi_part'));
    if (!multiPartTask) return; // bank has no multi_part task — nothing to assert
    const anonId = randomUUID();

    await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${multiPartTask.id}/attempt`,
      headers: { 'x-anon-id': anonId },
      payload: { answer: { a: 'definitely wrong' } },
    });

    const res = await detail(anonId, multiPartTask.taskNumber);
    const body = res.json();
    expect(body.errorBreakdown.some((e: { signature: string }) => e.signature.includes(':'))).toBe(
      true,
    );
  });

  it('skillBreakdown reports real linked skills with this user’s real mastery', async () => {
    const links = await testDb.db.select().from(schema.taskSkills);
    const byTask = new Map<string, string[]>();
    for (const link of links) {
      const list = byTask.get(link.taskId) ?? [];
      list.push(link.skillId);
      byTask.set(link.taskId, list);
    }
    const [taskId] = [...byTask.keys()];
    if (!taskId) return; // no skill-linked task in this bank — nothing to assert
    const [task] = await testDb.db.select().from(schema.tasks).where(eq(schema.tasks.id, taskId));
    const anonId = randomUUID();

    await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task!.id}/attempt`,
      headers: { 'x-anon-id': anonId },
      payload: { answer: task!.correctAnswer },
    });

    const res = await detail(anonId, task!.taskNumber);
    const body = res.json();
    expect(body.skillBreakdown.length).toBeGreaterThan(0);
    for (const skill of body.skillBreakdown) {
      expect(typeof skill.skillName).toBe('string');
      expect(skill.mastery).toBeGreaterThanOrEqual(0);
    }
  });

  it('a skill linked but never attempted by this user reports mastery 0, not omitted', async () => {
    const links = await testDb.db.select().from(schema.taskSkills);
    if (links.length === 0) return;
    const [task] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.id, links[0]!.taskId));
    const anonId = randomUUID(); // never attempted anything

    const res = await detail(anonId, task!.taskNumber);
    const body = res.json();
    const skill = body.skillBreakdown.find(
      (s: { skillId: string }) => s.skillId === links[0]!.skillId,
    );
    expect(skill).toBeTruthy();
    expect(skill.mastery).toBe(0);
  });

  it('recentAccuracy/previousAccuracy require enough attempts and compare two real windows', async () => {
    const anonId = randomUUID();
    const [task] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.taskNumber, 10));

    // 1-2 attempts: insufficient for recentAccuracy.
    await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task!.id}/attempt`,
      headers: { 'x-anon-id': anonId },
      payload: { answer: 'wrong' },
    });
    let res = await detail(anonId, 10);
    expect(res.json().recentAccuracy).toBeNull();

    // 3rd attempt: enough for recentAccuracy, still not for previousAccuracy
    // (no full earlier window exists yet).
    await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task!.id}/attempt`,
      headers: { 'x-anon-id': anonId },
      payload: { answer: 'wrong' },
    });
    await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task!.id}/attempt`,
      headers: { 'x-anon-id': anonId },
      payload: { answer: task!.correctAnswer },
    });
    res = await detail(anonId, 10);
    const body = res.json();
    expect(body.recentAccuracy).not.toBeNull();
    expect(body.previousAccuracy).toBeNull();
  });

  it('speedSignal is null with fewer than 3 timed attempts (insufficient-data minimum)', async () => {
    const anonId = randomUUID();
    const [task] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.taskNumber, 11));

    await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task!.id}/attempt`,
      headers: { 'x-anon-id': anonId },
      payload: { answer: 'wrong', timeSpentMs: 20000 },
    });
    await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task!.id}/attempt`,
      headers: { 'x-anon-id': anonId },
      payload: { answer: 'wrong again', timeSpentMs: 25000 },
    });

    const res = await detail(anonId, 11);
    expect(res.json().speedSignal.value).toBeNull();
  });

  it('speedSignal computes a real value once the taskNumber baseline has >= 3 timed samples', async () => {
    const anonId = randomUUID();
    const [task] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.taskNumber, 12));

    for (const ms of [20000, 20000, 20000]) {
      await app.inject({
        method: 'POST',
        url: `/api/v1/tasks/${task!.id}/attempt`,
        headers: { 'x-anon-id': anonId },
        payload: { answer: 'wrong', timeSpentMs: ms },
      });
    }
    // Most recent attempt, much slower than the 20000ms baseline.
    await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task!.id}/attempt`,
      headers: { 'x-anon-id': anonId },
      payload: { answer: 'wrong', timeSpentMs: 40000 },
    });

    const res = await detail(anonId, 12);
    const body = res.json();
    expect(body.speedSignal.value).toBe(100); // exactly 2x the baseline median
    expect(body.speedSignal.baselineLevel).toBe('taskNumber');
    expect(body.speedSignal.sampleSize).toBeGreaterThanOrEqual(3);
  });

  it('works generically for an arbitrary subject it has never seen hardcoded for', async () => {
    const anonId = randomUUID();
    const res = await detail(anonId, 1, 'russian');
    // No published russian tasks in this bank — still a clean 200 with
    // real zeros/nulls, never a crash from an unexpected subject id.
    expect(res.statusCode).toBe(200);
    expect(res.json().attempts).toBe(0);
  });

  it('never cross-contaminates between users', async () => {
    const anonA = randomUUID();
    const anonB = randomUUID();
    const [task] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.taskNumber, 13));

    await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task!.id}/attempt`,
      headers: { 'x-anon-id': anonA },
      payload: { answer: task!.correctAnswer },
    });

    const resB = await detail(anonB, 13);
    expect(resB.json().attempts).toBe(0);
  });
});
