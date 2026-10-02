import { schema } from '@zybrilka/db';
import { createImportedTestDb } from '@zybrilka/db/testing';
import { and, eq, isNotNull } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { syncSkillsFromCanonicalSolutions } from './sync.js';

// The real, unique methodTags currently used by tasks 13-19's authored
// canonical solutions (packages/shared/src/solutionTemplates/math/**).
// Not invented — see each realTaskNVariant1.ts's `methodTags` field.
const EXPECTED_METHOD_TAGS = [
  'substitution',
  'factoring',
  'quadratic_in_trig_function',
  'coordinate_method',
  'vectors',
  'plane_intersection',
  'domain_analysis',
  'sign_analysis',
  'variable_introduction',
  'percentage_growth',
  'equal_payment_equation',
  'incircle_tangency',
  'kite_properties',
  'parameter_investigation',
  'case_analysis',
  'cubic_factoring',
  'divisibility',
  'bounding_argument',
] as const;

const TASKS_WITH_CANONICAL_SOLUTIONS = [13, 14, 15, 16, 17, 18, 19];

describe('syncSkillsFromCanonicalSolutions (ZUBRILKA LEARNING INTELLIGENCE Phase 2)', () => {
  let testDb: Awaited<ReturnType<typeof createImportedTestDb>>;

  beforeAll(async () => {
    testDb = await createImportedTestDb();
  });

  afterAll(async () => {
    await testDb.close();
  });

  it('first run creates one skill per unique methodTag actually used by tasks 13-19', async () => {
    const result = await syncSkillsFromCanonicalSolutions(testDb.db);
    expect(result.skillsCreated).toBe(EXPECTED_METHOD_TAGS.length);

    const skills = await testDb.db
      .select()
      .from(schema.skills)
      .where(eq(schema.skills.subjectId, 'math'));
    expect(skills).toHaveLength(EXPECTED_METHOD_TAGS.length);
    const slugs = skills.map((s) => s.slug).sort();
    expect(slugs).toEqual([...EXPECTED_METHOD_TAGS].sort());
  });

  it('first run creates a task_skill link for every (task, methodTag) pair', async () => {
    // 7 tasks x 3 methodTags each = 21 links, derived from the real
    // canonical solutions, not assumed.
    const links = await testDb.db.select().from(schema.taskSkills);
    expect(links).toHaveLength(21);
    expect(links.every((l) => l.source === 'canonical')).toBe(true);
  });

  it('every real methodTag from tasks 13-19 has a matching skill', async () => {
    const skills = await testDb.db
      .select()
      .from(schema.skills)
      .where(eq(schema.skills.subjectId, 'math'));
    const slugSet = new Set(skills.map((s) => s.slug));
    for (const tag of EXPECTED_METHOD_TAGS) {
      expect(slugSet.has(tag)).toBe(true);
    }
  });

  it('every task with a canonical solution has at least one task_skill', async () => {
    for (const taskNumber of TASKS_WITH_CANONICAL_SOLUTIONS) {
      const [task] = await testDb.db
        .select()
        .from(schema.tasks)
        .where(and(eq(schema.tasks.subjectId, 'math'), eq(schema.tasks.taskNumber, taskNumber)));
      expect(task).toBeDefined();
      const links = await testDb.db
        .select()
        .from(schema.taskSkills)
        .where(eq(schema.taskSkills.taskId, task!.id));
      expect(links.length).toBeGreaterThan(0);
    }
  });

  it('creates no task_skills for tasks whose methodTags are not mapped (e.g. no canonical solution at all)', async () => {
    const tasksWithHash = await testDb.db
      .select()
      .from(schema.tasks)
      .where(isNotNull(schema.tasks.contentHash));
    // Sanity: the imported + seeded DB has more content-hashed tasks than
    // the 7 that actually have an authored canonical solution.
    expect(tasksWithHash.length).toBeGreaterThan(TASKS_WITH_CANONICAL_SOLUTIONS.length);

    const allLinks = await testDb.db.select().from(schema.taskSkills);
    const linkedTaskIds = new Set(allLinks.map((l) => l.taskId));
    // Every linked task must be one of the real 13-19 canonical-solution tasks.
    for (const taskId of linkedTaskIds) {
      const [task] = await testDb.db.select().from(schema.tasks).where(eq(schema.tasks.id, taskId));
      expect(TASKS_WITH_CANONICAL_SOLUTIONS).toContain(task!.taskNumber);
    }
  });

  it('does not change task IDs or contentHash', async () => {
    const before = await testDb.db
      .select({
        id: schema.tasks.id,
        contentHash: schema.tasks.contentHash,
        taskNumber: schema.tasks.taskNumber,
      })
      .from(schema.tasks)
      .where(eq(schema.tasks.subjectId, 'math'));

    await syncSkillsFromCanonicalSolutions(testDb.db);

    const after = await testDb.db
      .select({
        id: schema.tasks.id,
        contentHash: schema.tasks.contentHash,
        taskNumber: schema.tasks.taskNumber,
      })
      .from(schema.tasks)
      .where(eq(schema.tasks.subjectId, 'math'));

    expect(after).toEqual(before);
  });

  it('second run is fully idempotent: zero new skills, zero new links', async () => {
    const result = await syncSkillsFromCanonicalSolutions(testDb.db);
    expect(result.skillsCreated).toBe(0);
    expect(result.linksCreated).toBe(0);

    const skills = await testDb.db
      .select()
      .from(schema.skills)
      .where(eq(schema.skills.subjectId, 'math'));
    expect(skills).toHaveLength(EXPECTED_METHOD_TAGS.length);
    const links = await testDb.db.select().from(schema.taskSkills);
    expect(links).toHaveLength(21);
  });
});
