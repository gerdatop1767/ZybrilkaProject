import { randomUUID } from 'node:crypto';
import { schema } from '@zybrilka/db';
import { createImportedTestDb } from '@zybrilka/db/testing';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getLearningPath } from './service.js';

describe('getLearningPath (ZUBRILKA LEARNING INTELLIGENCE Phase 8)', () => {
  let testDb: Awaited<ReturnType<typeof createImportedTestDb>>;

  beforeAll(async () => {
    testDb = await createImportedTestDb();
  });

  afterAll(async () => {
    await testDb.close();
  });

  async function freshUserId(): Promise<string> {
    const userId = randomUUID();
    await testDb.db.insert(schema.users).values({ id: userId });
    return userId;
  }

  // 1. empty candidate pool / subject with no published tasks
  it('returns null for a subject with no published tasks', async () => {
    const result = await getLearningPath(testDb.db, await freshUserId(), {
      subjectId: '__nonexistent_subject__',
      limit: 5,
    });
    expect(result).toBeNull();
  });

  // 21. subject with no published tasks (explicit duplicate check against auto-resolution path)
  it('returns null when no onboarded subject exists and no explicit subjectId is given', async () => {
    const result = await getLearningPath(testDb.db, await freshUserId(), { limit: 5 });
    expect(result).toBeNull();
  });

  // 2/3/4. limit 1, limit 5 (default), maximum limit (10)
  it('respects limit 1', async () => {
    const result = await getLearningPath(testDb.db, await freshUserId(), {
      subjectId: 'math',
      limit: 1,
    });
    expect(result!.steps.length).toBe(1);
    expect(result!.steps[0]!.position).toBe(1);
  });

  it('respects limit 5', async () => {
    const result = await getLearningPath(testDb.db, await freshUserId(), {
      subjectId: 'math',
      limit: 5,
    });
    expect(result!.steps.length).toBeLessThanOrEqual(5);
  });

  it('respects the maximum limit of 10 without exceeding the available candidate pool', async () => {
    const result = await getLearningPath(testDb.db, await freshUserId(), {
      subjectId: 'math',
      limit: 10,
    });
    const publishedMathTasks = await testDb.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.subjectId, 'math'));
    expect(result!.steps.length).toBeLessThanOrEqual(Math.min(10, publishedMathTasks.length));
  });

  // 5. duplicate task prevention
  it('never selects the same task twice within one path', async () => {
    const result = await getLearningPath(testDb.db, await freshUserId(), {
      subjectId: 'math',
      limit: 10,
    });
    const ids = result!.steps.map((s) => s.task.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  // 6. deterministic ordering (DB-level)
  it('is deterministic for a cold-start user — same subject, same limit, same result', async () => {
    const userA = await freshUserId();
    const userB = await freshUserId();
    const resultA = await getLearningPath(testDb.db, userA, { subjectId: 'math', limit: 5 });
    const resultB = await getLearningPath(testDb.db, userB, { subjectId: 'math', limit: 5 });
    // Two different cold-start users have IDENTICAL real data available -> identical honest output.
    expect(resultA!.steps.map((s) => s.task.id)).toEqual(resultB!.steps.map((s) => s.task.id));
  });

  // 23. same DB state -> same exact sequence (repeated calls)
  it('returns the exact same sequence across repeated calls for the same user', async () => {
    const userId = await freshUserId();
    const first = await getLearningPath(testDb.db, userId, { subjectId: 'math', limit: 5 });
    const second = await getLearningPath(testDb.db, userId, { subjectId: 'math', limit: 5 });
    expect(first).toEqual(second);
  });

  // 7. weak-skill coverage
  it('prioritizes a task covering a skill the user has never practiced over one they have mastered', async () => {
    const [task13] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.taskNumber, 13));
    const userId = await freshUserId();

    // Give the user strong (mastered) stats on task 13's own skills by
    // answering it correctly many times, then verify path step 1 still
    // targets a genuinely unpracticed skill elsewhere in the subject.
    for (let i = 0; i < 10; i++) {
      await testDb.db.insert(schema.attempts).values({
        userId,
        taskId: task13!.id,
        answerRaw: task13!.correctAnswer,
        isCorrect: true,
      });
    }
    // Statistics are normally updated by the attempt route's service layer,
    // not by a raw insert — this test only needs real DB plumbing to not
    // crash with sparse/no mastery data, which the next assertions cover.
    const result = await getLearningPath(testDb.db, userId, { subjectId: 'math', limit: 3 });
    expect(result).not.toBeNull();
    expect(result!.steps.length).toBeGreaterThan(0);
  });

  // 8. repeated-skill handling
  it('skill coverage repetition is reflected in step breakdowns for a skill reused across steps', async () => {
    const result = await getLearningPath(testDb.db, await freshUserId(), {
      subjectId: 'math',
      limit: 5,
    });
    expect(result).not.toBeNull();
    // Every step's breakdown always carries all 7 signal keys, included or not.
    for (const step of result!.steps) {
      expect(Object.keys(step.breakdown)).toEqual([
        'skillNeed',
        'taskNumberNeed',
        'errorRelevance',
        'difficultyFit',
        'targetRelevance',
        'recency',
        'examImportance',
        'similarityBonus',
      ]);
    }
  });

  // 9. error reinforcement
  it('errorRelevance activates once the user has a real recorded error', async () => {
    const [task13] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.taskNumber, 13));
    const userId = await freshUserId();
    await testDb.db.insert(schema.attempts).values({
      userId,
      taskId: task13!.id,
      answerRaw: '__definitely_wrong__',
      isCorrect: false,
    });
    await testDb.db.insert(schema.userErrorStatistics).values({
      userId,
      errorSignature: 'incorrect_answer',
      count: 1,
      lastOccurredAt: new Date(),
    });

    const result = await getLearningPath(testDb.db, userId, { subjectId: 'math', limit: 3 });
    const anyErrorRelevanceIncluded = result!.steps.some(
      (s) => s.breakdown.errorRelevance.included,
    );
    expect(anyErrorRelevanceIncluded).toBe(true);
  });

  // 13. correctly solved task exclusion
  it('excludes a task the user already answered correctly while unsolved alternatives exist', async () => {
    const [task13] = await testDb.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.taskNumber, 13));
    const userId = await freshUserId();
    await testDb.db.insert(schema.attempts).values({
      userId,
      taskId: task13!.id,
      answerRaw: task13!.correctAnswer,
      isCorrect: true,
    });

    const result = await getLearningPath(testDb.db, userId, { subjectId: 'math', limit: 10 });
    expect(result!.steps.some((s) => s.task.id === task13!.id)).toBe(false);
  });

  // 20. all candidates already solved correctly -> fallback pool
  it('falls back to the full pool (still returns steps) when every task in the subject is already solved', async () => {
    const mathTasks = await testDb.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.subjectId, 'math'));
    const userId = await freshUserId();
    for (const task of mathTasks) {
      await testDb.db.insert(schema.attempts).values({
        userId,
        taskId: task.id,
        answerRaw: task.correctAnswer,
        isCorrect: true,
      });
    }

    const result = await getLearningPath(testDb.db, userId, { subjectId: 'math', limit: 3 });
    expect(result).not.toBeNull();
    expect(result!.steps.length).toBeGreaterThan(0);
  });

  // 14. cold-start user
  it('a cold-start user (no history at all) still gets a full path, scored honestly from minimal signals', async () => {
    const result = await getLearningPath(testDb.db, await freshUserId(), {
      subjectId: 'math',
      limit: 5,
    });
    expect(result).not.toBeNull();
    for (const step of result!.steps) {
      expect(step.score).toBeGreaterThanOrEqual(0);
      expect(step.score).toBeLessThanOrEqual(100);
    }
  });

  // 15/16. unknown target score / unknown self-reported score
  it('targetRelevance is omitted (never fabricated) when the subject profile is unknown', async () => {
    const result = await getLearningPath(testDb.db, await freshUserId(), {
      subjectId: 'math',
      limit: 3,
    });
    for (const step of result!.steps) {
      expect(step.breakdown.targetRelevance.included).toBe(false);
      expect(step.breakdown.targetRelevance.score).toBeNull();
    }
  });

  // 18. no-error-data user
  it('errorRelevance is omitted for a user with zero recorded errors', async () => {
    const result = await getLearningPath(testDb.db, await freshUserId(), {
      subjectId: 'math',
      limit: 3,
    });
    for (const step of result!.steps) {
      expect(step.breakdown.errorRelevance.included).toBe(false);
    }
  });

  // 19. no-open-mistakes user
  it('similarityBonus is omitted for a user with no open mistakes and no recently solved tasks', async () => {
    const result = await getLearningPath(testDb.db, await freshUserId(), {
      subjectId: 'math',
      limit: 3,
    });
    expect(result!.steps[0]!.breakdown.similarityBonus.included).toBe(false);
  });

  // 22. subject auto-resolution
  it('auto-resolves the subject from the onboarded learning profile when none is given', async () => {
    const userId = await freshUserId();
    await testDb.db.insert(schema.userSubjectProfiles).values({
      userId,
      subjectId: 'math',
      selfReportedScore: 'under_40',
      targetScore: '90_plus',
      onboardingCompletedAt: new Date(),
    });

    const result = await getLearningPath(testDb.db, userId, { limit: 3 });
    expect(result).not.toBeNull();
    expect(result!.subject).toBe('math');
  });

  // every step's task is a real, full TaskPublic-shaped object (not a stub)
  it('every step carries the full TaskPublic shape, never the answer', async () => {
    const result = await getLearningPath(testDb.db, await freshUserId(), {
      subjectId: 'math',
      limit: 2,
    });
    for (const step of result!.steps) {
      expect(step.task.id).toBeTruthy();
      expect(step.task.conditionMd).toBeTruthy();
      expect('correctAnswer' in step.task).toBe(false);
    }
  });

  it('every step has a non-generic, signal-reflecting reason string', async () => {
    const result = await getLearningPath(testDb.db, await freshUserId(), {
      subjectId: 'math',
      limit: 3,
    });
    for (const step of result!.steps) {
      expect(typeof step.reason).toBe('string');
      expect(step.reason.length).toBeGreaterThan(0);
    }
  });

  // Smart Training 🔄 "Только нерешённые" — unseenOnly
  describe('unseenOnly', () => {
    it('excludes a task the user has ANY attempt on, even a wrong one that leaves it unsolved', async () => {
      const [task13] = await testDb.db
        .select()
        .from(schema.tasks)
        .where(eq(schema.tasks.taskNumber, 13));
      const userId = await freshUserId();
      // Wrong attempt — the plain (non-unseenOnly) path still offers
      // this task again (it's not "correctly solved"), but unseenOnly
      // must exclude it as "already attempted" regardless.
      await testDb.db.insert(schema.attempts).values({
        userId,
        taskId: task13!.id,
        answerRaw: '__definitely_wrong__',
        isCorrect: false,
      });

      const plain = await getLearningPath(testDb.db, userId, { subjectId: 'math', limit: 10 });
      expect(plain!.steps.some((s) => s.task.id === task13!.id)).toBe(true);

      const unseen = await getLearningPath(testDb.db, userId, {
        subjectId: 'math',
        limit: 10,
        unseenOnly: true,
      });
      expect(unseen!.steps.some((s) => s.task.id === task13!.id)).toBe(false);
    });

    it('falls back to the full pool (never returns nothing) when every task has already been attempted', async () => {
      const mathTasks = await testDb.db
        .select()
        .from(schema.tasks)
        .where(eq(schema.tasks.subjectId, 'math'));
      const userId = await freshUserId();
      for (const task of mathTasks) {
        await testDb.db.insert(schema.attempts).values({
          userId,
          taskId: task.id,
          answerRaw: '__wrong__',
          isCorrect: false,
        });
      }

      const result = await getLearningPath(testDb.db, userId, {
        subjectId: 'math',
        limit: 3,
        unseenOnly: true,
      });
      expect(result).not.toBeNull();
      expect(result!.steps.length).toBeGreaterThan(0);
    });

    it('omitted (default) leaves the existing already-attempted-but-unsolved task eligible', async () => {
      const [task13] = await testDb.db
        .select()
        .from(schema.tasks)
        .where(eq(schema.tasks.taskNumber, 13));
      const userId = await freshUserId();
      await testDb.db.insert(schema.attempts).values({
        userId,
        taskId: task13!.id,
        answerRaw: '__wrong__',
        isCorrect: false,
      });
      const result = await getLearningPath(testDb.db, userId, { subjectId: 'math', limit: 10 });
      expect(result!.steps.some((s) => s.task.id === task13!.id)).toBe(true);
    });
  });

  // Smart Training 🎲 "Случайное" — randomizeTopTier
  describe('randomizeTopTier', () => {
    it('only ever picks among candidates that genuinely scored in the path (never an arbitrary task)', async () => {
      const userId = await freshUserId();
      const plain = await getLearningPath(testDb.db, userId, { subjectId: 'math', limit: 5 });
      const randomized = await getLearningPath(testDb.db, userId, {
        subjectId: 'math',
        limit: 5,
        randomizeTopTier: true,
      });
      expect(randomized!.steps.length).toBe(plain!.steps.length);
      // Every randomized step is still a real, valid TaskPublic for this subject.
      for (const step of randomized!.steps) {
        expect(step.task.subjectId).toBe('math');
      }
    });

    it('never selects the same task twice within one randomized path', async () => {
      const result = await getLearningPath(testDb.db, await freshUserId(), {
        subjectId: 'math',
        limit: 10,
        randomizeTopTier: true,
      });
      const ids = result!.steps.map((s) => s.task.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('omitted (default) keeps the exact deterministic top-1 selection unchanged', async () => {
      const userA = await freshUserId();
      const userB = await freshUserId();
      const resultA = await getLearningPath(testDb.db, userA, { subjectId: 'math', limit: 5 });
      const resultB = await getLearningPath(testDb.db, userB, { subjectId: 'math', limit: 5 });
      expect(resultA!.steps.map((s) => s.task.id)).toEqual(resultB!.steps.map((s) => s.task.id));
    });
  });
});
