import { schema } from '@zybrilka/db';
import { createImportedTestDb } from '@zybrilka/db/testing';
import { and, eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as service from './service.js';
import { syncSkillsFromCanonicalSolutions } from './sync.js';

describe('skills service (Phase 2 — getSkillsForTask / getTasksForSkill / getSkillsBySubject)', () => {
  let testDb: Awaited<ReturnType<typeof createImportedTestDb>>;

  beforeAll(async () => {
    testDb = await createImportedTestDb();
    await syncSkillsFromCanonicalSolutions(testDb.db);
  });

  afterAll(async () => {
    await testDb.close();
  });

  async function task13Id() {
    const [task] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(and(eq(schema.tasks.subjectId, 'math'), eq(schema.tasks.taskNumber, 13)));
    return task!.id;
  }

  it("getSkillsForTask returns task 13's real methodTag-derived skills", async () => {
    const taskId = await task13Id();
    const skills = await service.getSkillsForTask(testDb.db, taskId);
    const slugs = skills.map((s) => s.slug).sort();
    expect(slugs).toEqual(['factoring', 'quadratic_in_trig_function', 'substitution']);
  });

  it('getSkillsForTask returns an empty array for a task with no mapped skills', async () => {
    const [demoTask] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(and(eq(schema.tasks.subjectId, 'math'), eq(schema.tasks.taskNumber, 1)));
    const skills = await service.getSkillsForTask(testDb.db, demoTask!.id);
    expect(skills).toEqual([]);
  });

  it('getTasksForSkill returns every task linked to a given skill', async () => {
    const [substitutionSkill] = await testDb.db
      .select()
      .from(schema.skills)
      .where(and(eq(schema.skills.subjectId, 'math'), eq(schema.skills.slug, 'substitution')));
    const taskIds = await service.getTasksForSkill(testDb.db, substitutionSkill!.id);

    const task13 = await task13Id();
    const [task15] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(and(eq(schema.tasks.subjectId, 'math'), eq(schema.tasks.taskNumber, 15)));

    expect(taskIds.sort()).toEqual([task13, task15!.id].sort());
  });

  it('getSkillsBySubject returns all 18 math skills, scoped only to math', async () => {
    const skills = await service.getSkillsBySubject(testDb.db, 'math');
    expect(skills).toHaveLength(18);
    expect(skills.every((s) => s.subjectId === 'math')).toBe(true);
  });

  it('getSkillsBySubject returns an empty array for a subject with no skills yet', async () => {
    const skills = await service.getSkillsBySubject(testDb.db, 'russian');
    expect(skills).toEqual([]);
  });
});
