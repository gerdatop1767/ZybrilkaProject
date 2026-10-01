import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as schema from './schema.js';
import { createSeededTestDb, createTestDb } from './testing.js';

describe('skills / task_skills (ZUBRILKA LEARNING INTELLIGENCE Phase 2 foundation)', () => {
  let testDb: Awaited<ReturnType<typeof createSeededTestDb>>;

  beforeAll(async () => {
    testDb = await createSeededTestDb();
  });

  afterAll(async () => {
    await testDb.close();
  });

  it('creates a skill scoped to a real subject', async () => {
    const { db } = testDb;
    const [row] = await db
      .insert(schema.skills)
      .values({ subjectId: 'math', slug: 'test_skill_create', name: 'Тестовый навык' })
      .returning();
    expect(row?.subjectId).toBe('math');
    expect(row?.slug).toBe('test_skill_create');
    expect(row?.name).toBe('Тестовый навык');
  });

  it('rejects an invalid subjectId (FK)', async () => {
    const { db } = testDb;
    await expect(
      db.insert(schema.skills).values({
        subjectId: 'not_a_real_subject',
        slug: 'orphan_skill',
        name: 'Orphan',
      }),
    ).rejects.toThrow();
  });

  it('rejects a duplicate (subjectId, slug) pair', async () => {
    const { db } = testDb;
    await db
      .insert(schema.skills)
      .values({ subjectId: 'math', slug: 'test_skill_dup', name: 'Дубль 1' });
    await expect(
      db
        .insert(schema.skills)
        .values({ subjectId: 'math', slug: 'test_skill_dup', name: 'Дубль 2' }),
    ).rejects.toThrow();
  });

  it('allows the same slug for two different subjects', async () => {
    const { db } = testDb;
    await db
      .insert(schema.skills)
      .values({ subjectId: 'math', slug: 'shared_slug', name: 'Math skill' });
    const [russianRow] = await db
      .insert(schema.skills)
      .values({ subjectId: 'russian', slug: 'shared_slug', name: 'Russian skill' })
      .returning();
    expect(russianRow?.subjectId).toBe('russian');
  });

  async function firstTaskId() {
    const [task] = await testDb.db.select().from(schema.tasks).limit(1);
    return task!.id;
  }

  it('creates a task_skill link between a real task and a real skill', async () => {
    const { db } = testDb;
    const taskId = await firstTaskId();
    const [skill] = await db
      .insert(schema.skills)
      .values({ subjectId: 'math', slug: 'test_skill_link', name: 'Линкуемый навык' })
      .returning();

    const [link] = await db
      .insert(schema.taskSkills)
      .values({ taskId, skillId: skill!.id, source: 'canonical' })
      .returning();

    expect(link?.taskId).toBe(taskId);
    expect(link?.skillId).toBe(skill!.id);
    expect(link?.source).toBe('canonical');
  });

  it('rejects a duplicate (taskId, skillId) link', async () => {
    const { db } = testDb;
    const taskId = await firstTaskId();
    const [skill] = await db
      .insert(schema.skills)
      .values({ subjectId: 'math', slug: 'test_skill_dup_link', name: 'Дубль-линк' })
      .returning();

    await db.insert(schema.taskSkills).values({ taskId, skillId: skill!.id });
    await expect(
      db.insert(schema.taskSkills).values({ taskId, skillId: skill!.id }),
    ).rejects.toThrow();
  });

  it('rejects a task_skill with an invalid taskId or skillId (FK)', async () => {
    const { db } = testDb;
    const [skill] = await db
      .insert(schema.skills)
      .values({ subjectId: 'math', slug: 'test_skill_fk', name: 'FK-навык' })
      .returning();
    const taskId = await firstTaskId();

    await expect(
      db.insert(schema.taskSkills).values({ taskId: crypto.randomUUID(), skillId: skill!.id }),
    ).rejects.toThrow();
    await expect(
      db.insert(schema.taskSkills).values({ taskId, skillId: crypto.randomUUID() }),
    ).rejects.toThrow();
  });

  it('a task can have multiple distinct skills', async () => {
    const { db } = testDb;
    const taskId = await firstTaskId();
    const [skillA] = await db
      .insert(schema.skills)
      .values({ subjectId: 'math', slug: 'multi_a', name: 'Навык А' })
      .returning();
    const [skillB] = await db
      .insert(schema.skills)
      .values({ subjectId: 'math', slug: 'multi_b', name: 'Навык Б' })
      .returning();

    await db.insert(schema.taskSkills).values({ taskId, skillId: skillA!.id });
    await db.insert(schema.taskSkills).values({ taskId, skillId: skillB!.id });

    const links = await db
      .select()
      .from(schema.taskSkills)
      .where(eq(schema.taskSkills.taskId, taskId));
    const skillIds = links.map((l) => l.skillId);
    expect(skillIds).toContain(skillA!.id);
    expect(skillIds).toContain(skillB!.id);
  });
});

describe('skills table — bare migration only (no seed)', () => {
  it('starts empty on a fresh DB', async () => {
    const testDb = await createTestDb();
    const rows = await testDb.db.select().from(schema.skills);
    expect(rows).toHaveLength(0);
    await testDb.close();
  });
});
