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

  it('imports all 19 task numbers with no gaps, 17 published and 2 needs_review', async () => {
    const { db } = testDb;
    const result = await importVariant1(db);
    expect(result.total).toBe(19);
    expect(result.published).toBe(17);
    expect(result.needsReview).toBe(2);

    const rows = await db
      .select()
      .from(schema.tasks)
      .where(and(eq(schema.tasks.subjectId, 'math'), eq(schema.tasks.sourceVariant, 1)));
    expect(rows.length).toBe(19);

    const numbers = rows.map((r) => r.taskNumber).sort((a, b) => a - b);
    expect(numbers).toEqual(Array.from({ length: 19 }, (_, i) => i + 1));
  });

  it('marks task 15 (punctured interval) and task 19 (multi-part a/б/в) as needs_review, not published', async () => {
    const { db } = testDb;
    const rows = await db
      .select()
      .from(schema.tasks)
      .where(and(eq(schema.tasks.subjectId, 'math'), eq(schema.tasks.sourceVariant, 1)));
    const byNumber = new Map(rows.map((r) => [r.taskNumber, r]));
    expect(byNumber.get(15)?.status).toBe('needs_review');
    expect(byNumber.get(19)?.status).toBe('needs_review');
    // Every other task number is published.
    for (const [number, row] of byNumber) {
      if (number !== 15 && number !== 19) {
        expect(row.status).toBe('published');
      }
    }
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

  it('derives Часть 1 / Часть 2 from task number (1-12 vs 13-19)', () => {
    expect(partForTaskNumber(1)).toBe(1);
    expect(partForTaskNumber(12)).toBe(1);
    expect(partForTaskNumber(13)).toBe(2);
    expect(partForTaskNumber(19)).toBe(2);
  });
});
