import { randomUUID } from 'node:crypto';
import { schema } from '@zybrilka/db';
import { createImportedTestDb } from '@zybrilka/db/testing';
import { and, eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../app.js';
import { getCanonicalSolutionForTask } from './canonicalSolution.js';

describe('canonical solution in the Result flow (task 13, via the real HTTP API)', () => {
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

  async function getTask13WithSolution() {
    const [task13] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(and(eq(schema.tasks.subjectId, 'math'), eq(schema.tasks.taskNumber, 13)));
    expect(task13).toBeDefined();
    const anonId = randomUUID();
    // getTask only includes the solution (and canonicalSolution) after an attempt exists.
    await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task13!.id}/attempt`,
      headers: { 'x-anon-id': anonId },
      payload: { answer: 'что угодно' },
    });
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/tasks/${task13!.id}`,
      headers: { 'x-anon-id': anonId },
    });
    return { task13: task13!, body: res.json() };
  }

  it('(A) GET /tasks/:id returns canonicalSolution for the real task 13, after an attempt', async () => {
    const { body } = await getTask13WithSolution();
    expect(body.canonicalSolution).toBeDefined();
  });

  it('(B) canonicalSolution contains template metadata, parts a/b with steps, criticalPoints, and validation status/results', async () => {
    const { body } = await getTask13WithSolution();
    const cs = body.canonicalSolution;

    expect(cs.templateId).toBe('math.13.equation');
    expect(cs.templateVersion).toBe('1.0.0');

    expect(cs.parts.map((p: { id: string }) => p.id)).toEqual(['a', 'b']);
    for (const part of cs.parts) {
      expect(Array.isArray(part.steps)).toBe(true);
      expect(part.steps.length).toBeGreaterThan(0);
      for (const step of part.steps) {
        expect(typeof step.title).toBe('string');
        expect(typeof step.explanation).toBe('string');
      }
    }

    expect(Array.isArray(cs.criticalPoints)).toBe(true);
    expect(cs.criticalPoints.length).toBeGreaterThan(0);
    expect(cs.criticalPoints.map((p: { id: string }) => p.id)).toContain('part-a-required');

    expect(cs.validation.status).toBe('validated');
    expect(Array.isArray(cs.validation.results)).toBe(true);
    expect(cs.validation.results.every((r: { passed: boolean }) => r.passed)).toBe(true);

    expect(typeof cs.examWriteup).toBe('string');
    expect(cs.examWriteup).toContain('а)');
    expect(cs.examWriteup).toContain('б)');
    expect(cs.examWriteup).toContain('Ответ:');
  });

  it('(C) a task with no canonical template (task 1) has no canonicalSolution field', async () => {
    const [task1] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(and(eq(schema.tasks.subjectId, 'math'), eq(schema.tasks.taskNumber, 1)));
    const anonId = randomUUID();
    await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task1!.id}/attempt`,
      headers: { 'x-anon-id': anonId },
      payload: { answer: '0' },
    });
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/tasks/${task1!.id}`,
      headers: { 'x-anon-id': anonId },
    });
    expect(res.json()).not.toHaveProperty('canonicalSolution');
  });

  it('(D) explanationMd/solutionSteps keep working unchanged for task 13, alongside canonicalSolution', async () => {
    const { body } = await getTask13WithSolution();
    expect(typeof body.explanationMd).toBe('string');
    expect(body.explanationMd.length).toBeGreaterThan(0);
    expect(Array.isArray(body.solutionSteps)).toBe(true);
    expect(body.solutionSteps.length).toBeGreaterThan(0);
  });

  it('(E) existing answer checking still grades task 13 attempts server-side, untouched', async () => {
    const [task13] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(and(eq(schema.tasks.subjectId, 'math'), eq(schema.tasks.taskNumber, 13)));
    const anonId = randomUUID();

    const wrong = await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task13!.id}/attempt`,
      headers: { 'x-anon-id': anonId },
      payload: { answer: 'обязательно неверно' },
    });
    expect(wrong.json().correct).toBe(false);

    const right = await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task13!.id}/attempt`,
      headers: { 'x-anon-id': anonId },
      payload: { answer: task13!.correctAnswer },
    });
    expect(right.json().correct).toBe(true);
    // canonicalSolution has never been consulted for grading — it's not part of the attempt response at all.
    expect(right.json()).not.toHaveProperty('canonicalSolution');
  });

  it('(F) the DTO is plain, JSON-serializable data — no functions, no registry internals', async () => {
    const { body } = await getTask13WithSolution();
    const roundTripped = JSON.parse(JSON.stringify(body.canonicalSolution));
    expect(roundTripped).toEqual(body.canonicalSolution);

    function assertNoFunctions(value: unknown): void {
      if (typeof value === 'function') throw new Error('found a function in the DTO');
      if (Array.isArray(value)) {
        value.forEach(assertNoFunctions);
      } else if (value !== null && typeof value === 'object') {
        Object.values(value).forEach(assertNoFunctions);
      }
    }
    assertNoFunctions(body.canonicalSolution);

    // No internal engine/registry field names leak through.
    const serialized = JSON.stringify(body.canonicalSolution);
    expect(serialized).not.toContain('ruleType');
    expect(serialized).not.toContain('registry');
    expect(serialized).not.toContain('validationRuleId');
  });
});

describe('canonical solution in the Result flow (task 14, via the real HTTP API)', () => {
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

  async function getTask14WithSolution() {
    const [task14] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(and(eq(schema.tasks.subjectId, 'math'), eq(schema.tasks.taskNumber, 14)));
    expect(task14).toBeDefined();
    const anonId = randomUUID();
    await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task14!.id}/attempt`,
      headers: { 'x-anon-id': anonId },
      payload: { answer: 'что угодно' },
    });
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/tasks/${task14!.id}`,
      headers: { 'x-anon-id': anonId },
    });
    return { task14: task14!, body: res.json() };
  }

  it('(A) GET /tasks/:id returns canonicalSolution for the real task 14, after an attempt', async () => {
    const { body } = await getTask14WithSolution();
    expect(body.canonicalSolution).toBeDefined();
  });

  it('(B) canonicalSolution contains template metadata, parts a (proof, no answer) / b (checkable), criticalPoints, and validation status/results', async () => {
    const { body } = await getTask14WithSolution();
    const cs = body.canonicalSolution;

    expect(cs.templateId).toBe('math.14.stereometry');
    expect(cs.templateVersion).toBe('1.0.0');

    expect(cs.parts.map((p: { id: string }) => p.id)).toEqual(['a', 'b']);
    const partA = cs.parts.find((p: { id: string }) => p.id === 'a');
    const partB = cs.parts.find((p: { id: string }) => p.id === 'b');
    expect(partA.hasCheckableAnswer).toBe(false);
    expect(partA.answer).toBeUndefined();
    expect(partB.hasCheckableAnswer).toBe(true);
    for (const part of cs.parts) {
      expect(Array.isArray(part.steps)).toBe(true);
      expect(part.steps.length).toBeGreaterThan(0);
    }

    expect(Array.isArray(cs.criticalPoints)).toBe(true);
    expect(cs.criticalPoints.length).toBeGreaterThan(0);
    expect(cs.criticalPoints.map((p: { id: string }) => p.id)).toContain(
      'full-credit-requires-both-parts',
    );
    // Never presented to the client as fipi_verified — see realTask14Variant1.ts's own sourcing note.
    expect(cs.criticalPoints.some((p: { source: string }) => p.source === 'fipi_verified')).toBe(
      false,
    );

    expect(cs.validation.status).toBe('validated');
    expect(cs.validation.results.every((r: { passed: boolean }) => r.passed)).toBe(true);

    expect(typeof cs.examWriteup).toBe('string');
    expect(cs.examWriteup).toContain('а)');
    expect(cs.examWriteup).toContain('б)');
    expect(cs.examWriteup).toContain('Ответ:');
  });

  it('(C) explanationMd/solutionSteps keep working unchanged for task 14, alongside canonicalSolution', async () => {
    const { body } = await getTask14WithSolution();
    expect(typeof body.explanationMd).toBe('string');
    expect(body.explanationMd.length).toBeGreaterThan(0);
    expect(Array.isArray(body.solutionSteps)).toBe(true);
    expect(body.solutionSteps.length).toBeGreaterThan(0);
  });

  it('(D) existing answer checking still grades task 14 attempts server-side, untouched', async () => {
    const [task14] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(and(eq(schema.tasks.subjectId, 'math'), eq(schema.tasks.taskNumber, 14)));
    const anonId = randomUUID();

    const wrong = await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task14!.id}/attempt`,
      headers: { 'x-anon-id': anonId },
      payload: { answer: 'обязательно неверно' },
    });
    expect(wrong.json().correct).toBe(false);

    const right = await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task14!.id}/attempt`,
      headers: { 'x-anon-id': anonId },
      payload: { answer: task14!.correctAnswer },
    });
    expect(right.json().correct).toBe(true);
    expect(right.json()).not.toHaveProperty('canonicalSolution');
  });
});

describe('getCanonicalSolutionForTask (unit)', () => {
  it('returns undefined for any contentHash other than a known real task', () => {
    const result = getCanonicalSolutionForTask({
      id: 'some-other-task-id',
      subjectId: 'math',
      taskNumber: 13,
      contentHash: 'not-the-real-hash',
      correctAnswer: '42',
      correctAnswerDisplay: null,
    });
    expect(result).toBeUndefined();
  });

  it('returns undefined for a null contentHash (never crashes on missing data)', () => {
    expect(() =>
      getCanonicalSolutionForTask({
        id: 'x',
        subjectId: 'math',
        taskNumber: 13,
        contentHash: null,
        correctAnswer: '42',
        correctAnswerDisplay: null,
      }),
    ).not.toThrow();
  });

  it('task 13 and task 14 content never cross-match — each contentHash resolves to its own template/content, never the other', () => {
    const solution13 = getCanonicalSolutionForTask({
      id: 'id-13',
      subjectId: 'math',
      taskNumber: 13,
      contentHash: '5c674d67f90cd1a4b2bfc9bd6cdd47ec823d5463f73e0f6f58cd88921b9a5cab',
      correctAnswer: '-4π; -3π; -8π/3',
      correctAnswerDisplay: null,
    });
    const solution14 = getCanonicalSolutionForTask({
      id: 'id-14',
      subjectId: 'math',
      taskNumber: 14,
      contentHash: 'd7a4d76a3d9833dbe914bc8cdd9b12615911a4de80f999725f801837be7b366c',
      correctAnswer: 'arccos(√10/5)',
      correctAnswerDisplay: null,
    });

    expect(solution13?.templateId).toBe('math.13.equation');
    expect(solution14?.templateId).toBe('math.14.stereometry');
    expect(solution13?.templateId).not.toBe(solution14?.templateId);
  });

  it('a task 14 row whose taskNumber is 14 but whose contentHash does not match the real task 14 gets no canonical solution — taskNumber alone never triggers a match', () => {
    const result = getCanonicalSolutionForTask({
      id: 'a-different-task-14-in-the-future',
      subjectId: 'math',
      taskNumber: 14,
      contentHash: 'some-other-task-14-that-shares-the-number-but-not-the-content',
      correctAnswer: 'irrelevant',
      correctAnswerDisplay: null,
    });
    expect(result).toBeUndefined();
  });
});
