import { parseIntervalSet, parseMultiPartSpec } from '@zybrilka/shared';
import { and, eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as schema from './schema.js';
import { seed } from './seed.js';
import { importVariant1, partForTaskNumber } from './importEge2026Variant1.js';
import { createTestDb } from './testing.js';

describe('importVariant1', () => {
  let testDb: Awaited<ReturnType<typeof createTestDb>>;

  beforeAll(async () => {
    testDb = await createTestDb();
  });

  afterAll(async () => {
    await testDb.close();
  });

  it('imports all 19 task numbers with no gaps, all 19 now published (S3.1 closed the two S3 gaps)', async () => {
    const { db } = testDb;
    const result = await importVariant1(db);
    expect(result.total).toBe(19);
    expect(result.published).toBe(19);
    expect(result.needsReview).toBe(0);

    const rows = await db
      .select()
      .from(schema.tasks)
      .where(and(eq(schema.tasks.subjectId, 'math'), eq(schema.tasks.sourceVariant, 1)));
    expect(rows.length).toBe(19);

    const numbers = rows.map((r) => r.taskNumber).sort((a, b) => a - b);
    expect(numbers).toEqual(Array.from({ length: 19 }, (_, i) => i + 1));
    expect(rows.every((r) => r.status === 'published')).toBe(true);
  });

  it('task 15 is now answerType=interval with a well-formed interval-set answer', async () => {
    const { db } = testDb;
    const rows = await db
      .select()
      .from(schema.tasks)
      .where(and(eq(schema.tasks.subjectId, 'math'), eq(schema.tasks.sourceVariant, 1)));
    const task15 = rows.find((r) => r.taskNumber === 15);
    expect(task15?.answerType).toBe('interval');
    expect(parseIntervalSet(task15!.correctAnswer)).not.toBeNull();
  });

  it('task 19 is now answerType=multi_part with three well-formed parts (a/б/в)', async () => {
    const { db } = testDb;
    const rows = await db
      .select()
      .from(schema.tasks)
      .where(and(eq(schema.tasks.subjectId, 'math'), eq(schema.tasks.sourceVariant, 1)));
    const task19 = rows.find((r) => r.taskNumber === 19);
    expect(task19?.answerType).toBe('multi_part');
    const spec = parseMultiPartSpec(task19!.correctAnswer);
    expect(spec).not.toBeNull();
    expect(spec!.parts).toHaveLength(3);
    expect(spec!.parts.map((p) => p.correctAnswer)).toEqual(['нет', '607', '1066']);
  });

  it('keeps full provenance for every imported task', async () => {
    const { db } = testDb;
    const rows = await db
      .select()
      .from(schema.tasks)
      .where(and(eq(schema.tasks.subjectId, 'math'), eq(schema.tasks.sourceVariant, 1)));
    for (const row of rows) {
      expect(row.sourceDocument).toBe('ЕГЭ 2026 Ященко 36 вариантов');
      expect(row.sourceVariant).toBe(1);
      expect(row.sourcePage).toBeGreaterThanOrEqual(1);
      expect(row.rawStatement).toBeTruthy();
      expect(row.contentHash).toBeTruthy();
      expect(row.tags).toContain('ege-2026-variant-1');
    }
  });

  it('attaches an image to the two graph-dependent tasks (8 and 11) and no others', async () => {
    const { db } = testDb;
    const rows = await db
      .select()
      .from(schema.tasks)
      .where(and(eq(schema.tasks.subjectId, 'math'), eq(schema.tasks.sourceVariant, 1)));
    for (const row of rows) {
      if (row.taskNumber === 8 || row.taskNumber === 11) {
        expect(row.imageUrl).toMatch(/^\/tasks\/imports\/ege-2026-variant-1\//);
      } else {
        expect(row.imageUrl).toBeNull();
      }
    }
  });

  it('is idempotent — re-running does not duplicate rows or touch other sources', async () => {
    const { db } = testDb;
    await seed(db); // unrelated demo seed must survive untouched
    const demoBefore = await db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.source, 'Zybrilka demo (не ФИПИ)'));

    await importVariant1(db);
    const first = await db
      .select()
      .from(schema.tasks)
      .where(and(eq(schema.tasks.subjectId, 'math'), eq(schema.tasks.sourceVariant, 1)));
    await importVariant1(db);
    const second = await db
      .select()
      .from(schema.tasks)
      .where(and(eq(schema.tasks.subjectId, 'math'), eq(schema.tasks.sourceVariant, 1)));
    expect(second.length).toBe(first.length);

    const demoAfter = await db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.source, 'Zybrilka demo (не ФИПИ)'));
    expect(demoAfter.length).toBe(demoBefore.length);
  });

  it('creates exactly one collection and one variant with 19 ordered variant_tasks (S3.2)', async () => {
    const { db } = testDb;
    const result = await importVariant1(db);

    const collections = await db
      .select()
      .from(schema.collections)
      .where(eq(schema.collections.slug, 'ege-2026-yashchenko'));
    expect(collections).toHaveLength(1);
    expect(collections[0]!.id).toBe(result.collectionId);
    expect(collections[0]!.status).toBe('published');

    const variants = await db
      .select()
      .from(schema.variants)
      .where(eq(schema.variants.collectionId, result.collectionId));
    expect(variants).toHaveLength(1);
    expect(variants[0]!.id).toBe(result.variantId);
    expect(variants[0]!.variantNumber).toBe(1);
    expect(variants[0]!.status).toBe('published');

    const members = await db
      .select()
      .from(schema.variantTasks)
      .where(eq(schema.variantTasks.variantId, result.variantId))
      .orderBy(schema.variantTasks.position);
    expect(members).toHaveLength(19);
    expect(members.map((m) => m.position)).toEqual(Array.from({ length: 19 }, (_, i) => i + 1));

    // No duplicate task ids in the membership, and position N matches
    // taskNumber N — this is the exam's own order, not an arbitrary one.
    const taskIds = new Set(members.map((m) => m.taskId));
    expect(taskIds.size).toBe(19);
    const tasksById = new Map(
      (
        await db
          .select()
          .from(schema.tasks)
          .where(and(eq(schema.tasks.subjectId, 'math'), eq(schema.tasks.sourceVariant, 1)))
      ).map((t) => [t.id, t]),
    );
    for (const member of members) {
      expect(tasksById.get(member.taskId)?.taskNumber).toBe(member.position);
      expect(tasksById.get(member.taskId)?.status).toBe('published');
    }
  });

  it('re-running keeps one collection, one variant, and 19 variant_tasks (no duplicate membership)', async () => {
    const { db } = testDb;
    await importVariant1(db);
    const result = await importVariant1(db);

    const collections = await db
      .select()
      .from(schema.collections)
      .where(eq(schema.collections.slug, 'ege-2026-yashchenko'));
    expect(collections).toHaveLength(1);

    const variants = await db
      .select()
      .from(schema.variants)
      .where(eq(schema.variants.collectionId, result.collectionId));
    expect(variants).toHaveLength(1);

    const members = await db
      .select()
      .from(schema.variantTasks)
      .where(eq(schema.variantTasks.variantId, result.variantId));
    expect(members).toHaveLength(19);
  });

  it('derives Часть 1 / Часть 2 from task number (1-12 vs 13-19)', () => {
    expect(partForTaskNumber(1)).toBe(1);
    expect(partForTaskNumber(12)).toBe(1);
    expect(partForTaskNumber(13)).toBe(2);
    expect(partForTaskNumber(19)).toBe(2);
  });

  describe('content migration — re-import updates in place, never reseeds (EGE Fidelity Final Polish)', () => {
    it('keeps every task id stable across a re-import (production had this break: a fresh id every run orphaned attempts/mistakes/bookmarks)', async () => {
      const { db } = testDb;
      await importVariant1(db);
      const before = await db
        .select({ id: schema.tasks.id, taskNumber: schema.tasks.taskNumber })
        .from(schema.tasks)
        .where(and(eq(schema.tasks.subjectId, 'math'), eq(schema.tasks.sourceVariant, 1)));

      await importVariant1(db);
      const after = await db
        .select({ id: schema.tasks.id, taskNumber: schema.tasks.taskNumber })
        .from(schema.tasks)
        .where(and(eq(schema.tasks.subjectId, 'math'), eq(schema.tasks.sourceVariant, 1)));

      const idByNumberBefore = new Map(before.map((r) => [r.taskNumber, r.id]));
      for (const row of after) {
        expect(row.id).toBe(idByNumberBefore.get(row.taskNumber));
      }
    });

    it('a real attempt and mistake recorded against a task survive a re-import untouched (the exact FK break a delete-then-insert import would cause)', async () => {
      const { db } = testDb;
      await importVariant1(db);
      const [task6] = await db
        .select()
        .from(schema.tasks)
        .where(
          and(
            eq(schema.tasks.subjectId, 'math'),
            eq(schema.tasks.sourceVariant, 1),
            eq(schema.tasks.taskNumber, 6),
          ),
        );
      const [user] = await db.insert(schema.users).values({}).returning();
      const [attempt] = await db
        .insert(schema.attempts)
        .values({ userId: user!.id, taskId: task6!.id, answerRaw: '0', isCorrect: false })
        .returning();
      const [mistake] = await db
        .insert(schema.mistakes)
        .values({
          userId: user!.id,
          taskId: task6!.id,
          firstAttemptId: attempt!.id,
          lastAttemptId: attempt!.id,
        })
        .returning();

      // Re-importing must not throw an FK violation and must not touch
      // these rows — this is the scenario a delete-then-insert import
      // can never survive once a single real user has answered a task.
      await expect(importVariant1(db)).resolves.toBeDefined();

      const attemptAfter = await db
        .select()
        .from(schema.attempts)
        .where(eq(schema.attempts.id, attempt!.id));
      expect(attemptAfter).toHaveLength(1);
      expect(attemptAfter[0]!.taskId).toBe(task6!.id);

      const mistakeAfter = await db
        .select()
        .from(schema.mistakes)
        .where(eq(schema.mistakes.id, mistake!.id));
      expect(mistakeAfter).toHaveLength(1);
      expect(mistakeAfter[0]!.taskId).toBe(task6!.id);
    });

    it('overwrites stale content on an existing row instead of leaving it untouched (the exact production symptom: old plain-text content surviving because nothing ever re-synced it)', async () => {
      const { db } = testDb;
      await importVariant1(db);
      const [task6] = await db
        .select()
        .from(schema.tasks)
        .where(
          and(
            eq(schema.tasks.subjectId, 'math'),
            eq(schema.tasks.sourceVariant, 1),
            eq(schema.tasks.taskNumber, 6),
          ),
        );

      // Simulate a production row stuck with pre-LaTeX plain-text
      // content from an old import, and no correctAnswerDisplay.
      await db
        .update(schema.tasks)
        .set({
          conditionMd: 'Найдите корень уравнения sqrt(15x) = 1 2/3 x (plain text, stale).',
          solutionSteps: [{ title: 'Шаг', explanation: '15x = (25/9)x^2 (plain text, stale)' }],
        })
        .where(eq(schema.tasks.id, task6!.id));

      await importVariant1(db);

      const [task6After] = await db
        .select()
        .from(schema.tasks)
        .where(eq(schema.tasks.id, task6!.id));
      expect(task6After!.conditionMd).toContain('$\\sqrt{15x}');
      expect(task6After!.conditionMd).not.toContain('stale');
      expect(task6After!.solutionSteps![0]!.explanation).toContain('$');
      expect(task6After!.solutionSteps![0]!.explanation).not.toContain('stale');
    });
  });
});
