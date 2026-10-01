import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as schema from './schema.js';
import { createSeededTestDb } from './testing.js';

describe('user_skill_statistics (ZUBRILKA LEARNING INTELLIGENCE Phase 3)', () => {
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

  async function realSkillId(slug: string) {
    const [row] = await testDb.db
      .insert(schema.skills)
      .values({ subjectId: 'math', slug, name: slug })
      .returning({ id: schema.skills.id });
    return row!.id;
  }

  it('creates a row with the expected defaults', async () => {
    const { db } = testDb;
    const userId = await realUserId();
    const skillId = await realSkillId('row_create_test');

    const [row] = await db
      .insert(schema.userSkillStatistics)
      .values({ userId, skillId })
      .returning();

    expect(row?.attempts).toBe(0);
    expect(row?.correctAttempts).toBe(0);
    expect(row?.incorrectAttempts).toBe(0);
    expect(row?.mastery).toBe(0);
    expect(row?.confidence).toBe(0);
    expect(row?.lastAttemptAt).toBeNull();
  });

  it('rejects an invalid userId (FK)', async () => {
    const { db } = testDb;
    const skillId = await realSkillId('fk_user_test');
    await expect(
      db.insert(schema.userSkillStatistics).values({ userId: crypto.randomUUID(), skillId }),
    ).rejects.toThrow();
  });

  it('rejects an invalid skillId (FK)', async () => {
    const { db } = testDb;
    const userId = await realUserId();
    await expect(
      db.insert(schema.userSkillStatistics).values({ userId, skillId: crypto.randomUUID() }),
    ).rejects.toThrow();
  });

  it('rejects a duplicate (userId, skillId) pair', async () => {
    const { db } = testDb;
    const userId = await realUserId();
    const skillId = await realSkillId('dup_pair_test');

    await db.insert(schema.userSkillStatistics).values({ userId, skillId });
    await expect(
      db.insert(schema.userSkillStatistics).values({ userId, skillId }),
    ).rejects.toThrow();
  });

  it('onConflictDoUpdate on (userId, skillId) updates in place rather than duplicating', async () => {
    const { db } = testDb;
    const userId = await realUserId();
    const skillId = await realSkillId('upsert_test');

    await db
      .insert(schema.userSkillStatistics)
      .values({ userId, skillId, attempts: 1, correctAttempts: 1, mastery: 10, confidence: 10 })
      .onConflictDoUpdate({
        target: [schema.userSkillStatistics.userId, schema.userSkillStatistics.skillId],
        set: { attempts: 1, correctAttempts: 1, mastery: 10, confidence: 10 },
      });

    await db
      .insert(schema.userSkillStatistics)
      .values({ userId, skillId, attempts: 2, correctAttempts: 2, mastery: 20, confidence: 20 })
      .onConflictDoUpdate({
        target: [schema.userSkillStatistics.userId, schema.userSkillStatistics.skillId],
        set: { attempts: 2, correctAttempts: 2, mastery: 20, confidence: 20 },
      });

    const rows = await db
      .select()
      .from(schema.userSkillStatistics)
      .where(eq(schema.userSkillStatistics.userId, userId));
    const matching = rows.filter((r) => r.skillId === skillId);
    expect(matching).toHaveLength(1);
    expect(matching[0]?.attempts).toBe(2);
    expect(matching[0]?.mastery).toBe(20);
  });

  it('two different users can each have their own row for the same skill', async () => {
    const { db } = testDb;
    const userA = await realUserId();
    const userB = await realUserId();
    const skillId = await realSkillId('shared_skill_two_users');

    await db.insert(schema.userSkillStatistics).values({ userId: userA, skillId, attempts: 3 });
    await db.insert(schema.userSkillStatistics).values({ userId: userB, skillId, attempts: 7 });

    const rows = await db
      .select()
      .from(schema.userSkillStatistics)
      .where(eq(schema.userSkillStatistics.skillId, skillId));
    expect(rows).toHaveLength(2);
  });
});
