import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { canonicalSubjects } from './canonicalSubjects.js';
import * as schema from './schema.js';
import { syncSubjects } from './syncSubjects.js';
import { createTestDb } from './testing.js';

describe('syncSubjects', () => {
  let testDb: Awaited<ReturnType<typeof createTestDb>>;

  beforeAll(async () => {
    testDb = await createTestDb();
  });

  afterAll(async () => {
    await testDb.close();
  });

  it('upserts every canonical subject on a freshly migrated database (production deploy order)', async () => {
    const { db } = testDb;
    const result = await syncSubjects(db);
    expect(result.subjectCount).toBe(canonicalSubjects.length);

    const rows = await db.select().from(schema.subjects);
    const ids = rows.map((r) => r.id).sort();
    expect(ids).toEqual([...canonicalSubjects.map((s) => s.id)].sort());
  });

  it('is idempotent and safe to run on a database that already has real subject rows', async () => {
    const { db } = testDb;
    await syncSubjects(db);
    const first = await db.select().from(schema.subjects);
    await syncSubjects(db);
    const second = await db.select().from(schema.subjects);
    expect(second.length).toBe(first.length);
  });
});
