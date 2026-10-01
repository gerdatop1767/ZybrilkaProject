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

describe('canonical solution in the Result flow (task 15, via the real HTTP API)', () => {
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

  async function getTask15WithSolution() {
    const [task15] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(and(eq(schema.tasks.subjectId, 'math'), eq(schema.tasks.taskNumber, 15)));
    expect(task15).toBeDefined();
    const anonId = randomUUID();
    await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task15!.id}/attempt`,
      headers: { 'x-anon-id': anonId },
      payload: { answer: 'что угодно' },
    });
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/tasks/${task15!.id}`,
      headers: { 'x-anon-id': anonId },
    });
    return { task15: task15!, body: res.json() };
  }

  it('(A) GET /tasks/:id returns canonicalSolution for the real task 15, after an attempt', async () => {
    const { body } = await getTask15WithSolution();
    expect(body.canonicalSolution).toBeDefined();
  });

  it('(B) canonicalSolution contains template metadata, a single checkable "main" part, criticalPoints, and validation status/results', async () => {
    const { body } = await getTask15WithSolution();
    const cs = body.canonicalSolution;

    expect(cs.templateId).toBe('math.15.inequality');
    expect(cs.templateVersion).toBe('1.0.0');

    expect(cs.parts.map((p: { id: string }) => p.id)).toEqual(['main']);
    const mainPart = cs.parts[0];
    expect(mainPart.hasCheckableAnswer).toBe(true);
    expect(mainPart.steps.length).toBeGreaterThan(0);

    expect(Array.isArray(cs.criticalPoints)).toBe(true);
    expect(cs.criticalPoints.length).toBeGreaterThan(0);
    expect(cs.criticalPoints.map((p: { id: string }) => p.id)).toContain(
      'excluded-point-must-not-be-in-answer',
    );
    // Never presented to the client as fipi_verified — see realTask15Variant1.ts's own sourcing note.
    expect(cs.criticalPoints.some((p: { source: string }) => p.source === 'fipi_verified')).toBe(
      false,
    );

    expect(cs.validation.status).toBe('validated');
    expect(cs.validation.results.every((r: { passed: boolean }) => r.passed)).toBe(true);

    expect(typeof cs.examWriteup).toBe('string');
    expect(cs.examWriteup).toContain('ОДЗ');
    expect(cs.examWriteup).toContain('Ответ:');
  });

  it('(C) explanationMd/solutionSteps keep working unchanged for task 15, alongside canonicalSolution', async () => {
    const { body } = await getTask15WithSolution();
    expect(typeof body.explanationMd).toBe('string');
    expect(body.explanationMd.length).toBeGreaterThan(0);
    expect(Array.isArray(body.solutionSteps)).toBe(true);
    expect(body.solutionSteps.length).toBeGreaterThan(0);
  });

  it('(D) existing answer checking (interval-set checker) still grades task 15 attempts server-side, untouched', async () => {
    const [task15] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(and(eq(schema.tasks.subjectId, 'math'), eq(schema.tasks.taskNumber, 15)));
    const anonId = randomUUID();

    const wrong = await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task15!.id}/attempt`,
      headers: { 'x-anon-id': anonId },
      payload: { answer: 'обязательно неверно' },
    });
    expect(wrong.json().correct).toBe(false);

    const right = await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task15!.id}/attempt`,
      headers: { 'x-anon-id': anonId },
      payload: { answer: task15!.correctAnswer },
    });
    expect(right.json().correct).toBe(true);
    expect(right.json()).not.toHaveProperty('canonicalSolution');
  });
});

describe('canonical solution in the Result flow (task 16, via the real HTTP API)', () => {
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

  async function getTask16WithSolution() {
    const [task16] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(and(eq(schema.tasks.subjectId, 'math'), eq(schema.tasks.taskNumber, 16)));
    expect(task16).toBeDefined();
    const anonId = randomUUID();
    await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task16!.id}/attempt`,
      headers: { 'x-anon-id': anonId },
      payload: { answer: 'что угодно' },
    });
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/tasks/${task16!.id}`,
      headers: { 'x-anon-id': anonId },
    });
    return { task16: task16!, body: res.json() };
  }

  it('(A) GET /tasks/:id returns canonicalSolution for the real task 16, after an attempt', async () => {
    const { body } = await getTask16WithSolution();
    expect(body.canonicalSolution).toBeDefined();
  });

  it('(B) canonicalSolution contains template metadata, a single checkable "main" part, criticalPoints, and validation status/results', async () => {
    const { body } = await getTask16WithSolution();
    const cs = body.canonicalSolution;

    expect(cs.templateId).toBe('math.16.economics');
    expect(cs.templateVersion).toBe('1.0.0');

    expect(cs.parts.map((p: { id: string }) => p.id)).toEqual(['main']);
    const mainPart = cs.parts[0];
    expect(mainPart.hasCheckableAnswer).toBe(true);
    expect(mainPart.steps.length).toBeGreaterThan(0);

    expect(Array.isArray(cs.criticalPoints)).toBe(true);
    expect(cs.criticalPoints.length).toBeGreaterThan(0);
    expect(cs.criticalPoints.map((p: { id: string }) => p.id)).toContain(
      'variables-must-be-defined-and-justified',
    );
    // Never presented to the client as fipi_verified — see realTask16Variant1.ts's own sourcing note.
    expect(cs.criticalPoints.some((p: { source: string }) => p.source === 'fipi_verified')).toBe(
      false,
    );

    expect(cs.validation.status).toBe('validated');
    expect(cs.validation.results.every((r: { passed: boolean }) => r.passed)).toBe(true);

    expect(typeof cs.examWriteup).toBe('string');
    expect(cs.examWriteup).toContain('$A$');
    expect(cs.examWriteup).toContain('Ответ:');
  });

  it('(C) explanationMd/solutionSteps keep working unchanged for task 16, alongside canonicalSolution', async () => {
    const { body } = await getTask16WithSolution();
    expect(typeof body.explanationMd).toBe('string');
    expect(body.explanationMd.length).toBeGreaterThan(0);
    expect(Array.isArray(body.solutionSteps)).toBe(true);
    expect(body.solutionSteps.length).toBeGreaterThan(0);
  });

  it('(D) existing answer checking still grades task 16 attempts server-side, untouched', async () => {
    const [task16] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(and(eq(schema.tasks.subjectId, 'math'), eq(schema.tasks.taskNumber, 16)));
    const anonId = randomUUID();

    const wrong = await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task16!.id}/attempt`,
      headers: { 'x-anon-id': anonId },
      payload: { answer: 'обязательно неверно' },
    });
    expect(wrong.json().correct).toBe(false);

    const right = await app.inject({
      method: 'POST',
      url: `/api/v1/tasks/${task16!.id}/attempt`,
      headers: { 'x-anon-id': anonId },
      payload: { answer: task16!.correctAnswer },
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

  it('task 13, task 14, task 15, and task 16 content never cross-match — each contentHash resolves to its own template/content, never another', () => {
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
    const solution15 = getCanonicalSolutionForTask({
      id: 'id-15',
      subjectId: 'math',
      taskNumber: 15,
      contentHash: '97c7af5d295d3a0516d5e517b32f671f45b0e3055d03b2fb39de0d8d9d3017d2',
      correctAnswer: '(log_5(2);log_5(8)) ∪ (log_5(8);log_3(8)]',
      correctAnswerDisplay: null,
    });
    const solution16 = getCanonicalSolutionForTask({
      id: 'id-16',
      subjectId: 'math',
      taskNumber: 16,
      contentHash: '6014f377f0fa2bc80dca6d3710e8341fec930508a3e5f86652f303ff44aa97aa',
      correctAnswer: '5',
      correctAnswerDisplay: null,
    });

    expect(solution13?.templateId).toBe('math.13.equation');
    expect(solution14?.templateId).toBe('math.14.stereometry');
    expect(solution15?.templateId).toBe('math.15.inequality');
    expect(solution16?.templateId).toBe('math.16.economics');
    const templateIds = [
      solution13?.templateId,
      solution14?.templateId,
      solution15?.templateId,
      solution16?.templateId,
    ];
    expect(new Set(templateIds).size).toBe(4);
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

  it('a task 15 row whose taskNumber is 15 but whose contentHash does not match the real task 15 gets no canonical solution — taskNumber alone never triggers a match', () => {
    const result = getCanonicalSolutionForTask({
      id: 'a-different-task-15-in-the-future',
      subjectId: 'math',
      taskNumber: 15,
      contentHash: 'some-other-task-15-that-shares-the-number-but-not-the-content',
      correctAnswer: 'irrelevant',
      correctAnswerDisplay: null,
    });
    expect(result).toBeUndefined();
  });

  it('a task 16 row whose taskNumber is 16 but whose contentHash does not match the real task 16 gets no canonical solution — taskNumber alone never triggers a match', () => {
    const result = getCanonicalSolutionForTask({
      id: 'a-different-task-16-in-the-future',
      subjectId: 'math',
      taskNumber: 16,
      contentHash: 'some-other-task-16-that-shares-the-number-but-not-the-content',
      correctAnswer: 'irrelevant',
      correctAnswerDisplay: null,
    });
    expect(result).toBeUndefined();
  });
});
