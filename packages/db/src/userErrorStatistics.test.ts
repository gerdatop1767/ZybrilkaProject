import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as schema from './schema.js';
import { createSeededTestDb } from './testing.js';

describe('user_error_statistics (ZUBRILKA LEARNING INTELLIGENCE Phase 5)', () => {
  let testDb: Awaited<ReturnType<typeof createSeededTestDb>>;

  beforeAll(async () => {
    testDb = await createSeededTestDb();
  });

  afterAll(async () => {
    await testDb.close();
  });

  async function realUserId() {
    const [row] = await testDb.db
      .insert(schema.users)
      .values({})
      .returning({ id: schema.users.id });
    return row!.id;
  }

  it('creates a row with the expected defaults', async () => {
    const { db } = testDb;
    const userId = await realUserId();

    const [row] = await db
      .insert(schema.userErrorStatistics)
      .values({ userId, errorSignature: 'incorrect_answer' })
      .returning();

    expect(row?.errorSignature).toBe('incorrect_answer');
    expect(row?.count).toBe(0);
    expect(row?.lastOccurredAt).toBeNull();
  });

  it('rejects an invalid userId (FK)', async () => {
    const { db } = testDb;
    await expect(
      db.insert(schema.userErrorStatistics).values({
        userId: crypto.randomUUID(),
        errorSignature: 'incorrect_answer',
      }),
    ).rejects.toThrow();
  });

  it('rejects a duplicate (userId, errorSignature) pair', async () => {
    const { db } = testDb;
    const userId = await realUserId();
    await db.insert(schema.userErrorStatistics).values({ userId, errorSignature: 'blank_answer' });
    await expect(
      db.insert(schema.userErrorStatistics).values({ userId, errorSignature: 'blank_answer' }),
    ).rejects.toThrow();
  });

  it('allows the same errorSignature for two different users', async () => {
    const { db } = testDb;
    const userA = await realUserId();
    const userB = await realUserId();

    await db
      .insert(schema.userErrorStatistics)
      .values({ userId: userA, errorSignature: 'format_error' });
    await db
      .insert(schema.userErrorStatistics)
      .values({ userId: userB, errorSignature: 'format_error' });

    const rows = await db
      .select()
      .from(schema.userErrorStatistics)
      .where(eq(schema.userErrorStatistics.errorSignature, 'format_error'));
    expect(rows).toHaveLength(2);
  });

  it('onConflictDoUpdate on (userId, errorSignature) updates in place rather than duplicating', async () => {
    const { db } = testDb;
    const userId = await realUserId();

    await db
      .insert(schema.userErrorStatistics)
      .values({ userId, errorSignature: 'incorrect_answer', count: 1 })
      .onConflictDoUpdate({
        target: [schema.userErrorStatistics.userId, schema.userErrorStatistics.errorSignature],
        set: { count: 1 },
      });
    await db
      .insert(schema.userErrorStatistics)
      .values({ userId, errorSignature: 'incorrect_answer', count: 1 })
      .onConflictDoUpdate({
        target: [schema.userErrorStatistics.userId, schema.userErrorStatistics.errorSignature],
        set: { count: 2 },
      });

    const rows = await db
      .select()
      .from(schema.userErrorStatistics)
      .where(eq(schema.userErrorStatistics.userId, userId));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.count).toBe(2);
  });

  it('a part-level signature code (e.g. "part_incorrect:b") stores and round-trips as plain text', async () => {
    const { db } = testDb;
    const userId = await realUserId();

    const [row] = await db
      .insert(schema.userErrorStatistics)
      .values({ userId, errorSignature: 'part_incorrect:b', count: 3 })
      .returning();
    expect(row?.errorSignature).toBe('part_incorrect:b');
  });
});
