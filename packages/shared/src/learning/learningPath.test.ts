import { describe, expect, it } from 'vitest';
import {
  calculateSkillCoverageNeed,
  compareLearningPathCandidates,
  resolveStepIdealDifficulty,
} from './learningPath.js';
import { calculateSkillNeed } from './recommendation.js';

describe('calculateSkillCoverageNeed', () => {
  it('is null for a task with no linked skills', () => {
    expect(calculateSkillCoverageNeed([], new Map(), new Map())).toBeNull();
  });

  it('with zero prior coverage, matches calculateSkillNeed exactly', () => {
    const skillIds = ['s1', 's2'];
    const mastery = new Map([
      ['s1', 20],
      ['s2', 80],
    ]);
    const coverageNeed = calculateSkillCoverageNeed(skillIds, mastery, new Map());
    const plainNeed = calculateSkillNeed([20, 80]);
    expect(coverageNeed).toBe(plainNeed);
  });

  it('a skill never attempted (absent from mastery map) defaults to need 100', () => {
    expect(calculateSkillCoverageNeed(['s1'], new Map(), new Map())).toBe(100);
  });

  it('one prior coverage lowers need but does not zero it out', () => {
    const skillIds = ['s1'];
    const mastery = new Map([['s1', 0]]); // need = 100
    const need = calculateSkillCoverageNeed(skillIds, mastery, new Map([['s1', 1]]));
    expect(need).toBe(60); // 100 - 1*40
  });

  it('repeated coverage clamps at 0, never negative', () => {
    const skillIds = ['s1'];
    const mastery = new Map([['s1', 0]]); // need = 100
    const need = calculateSkillCoverageNeed(skillIds, mastery, new Map([['s1', 5]]));
    expect(need).toBe(0);
  });

  it('a high-need skill can still resurface after one repeat, outscoring an already-mastered skill', () => {
    // skill A: need=100, covered once -> 60. skill B: need=10 (mastery 90), never covered -> 10.
    const needA = calculateSkillCoverageNeed(['a'], new Map([['a', 0]]), new Map([['a', 1]]));
    const needB = calculateSkillCoverageNeed(['b'], new Map([['b', 90]]), new Map());
    expect(needA).toBeGreaterThan(needB!);
  });

  it('averages the coverage-adjusted need across multiple linked skills', () => {
    const skillIds = ['s1', 's2'];
    const mastery = new Map([
      ['s1', 0], // need 100
      ['s2', 0], // need 100
    ]);
    const coverage = new Map([['s1', 1]]); // s1 -> 60, s2 -> 100
    expect(calculateSkillCoverageNeed(skillIds, mastery, coverage)).toBe(80);
  });
});

describe('resolveStepIdealDifficulty', () => {
  it('is null with no subject calibration (cold start)', () => {
    expect(resolveStepIdealDifficulty(null, null)).toBeNull();
    expect(resolveStepIdealDifficulty(null, 50)).toBeNull();
  });

  it('step 1 (no previous step) targets plain subject-average mastery', () => {
    expect(resolveStepIdealDifficulty(70, null)).toBe(70);
  });

  it('nudges the target up from the previous step when mastery supports it', () => {
    // mastery=90 supports a ceiling of 100, previous difficulty 50 -> proposed 65, well under ceiling.
    expect(resolveStepIdealDifficulty(90, 50)).toBe(65);
  });

  it('caps the escalation at the mastery-based ceiling, never overshooting', () => {
    // mastery=40 -> ceiling 50. previous difficulty 45 -> proposed 60, capped to 50.
    expect(resolveStepIdealDifficulty(40, 45)).toBe(50);
  });

  it('steps back down toward the ceiling if the previous step was already above it', () => {
    // mastery=30 -> ceiling 40. previous difficulty 90 (e.g. a fallback/review task) -> capped to 40, not escalated further.
    expect(resolveStepIdealDifficulty(30, 90)).toBe(40);
  });

  it('never exceeds 100 or drops below 0', () => {
    expect(resolveStepIdealDifficulty(100, 100)).toBeLessThanOrEqual(100);
    expect(resolveStepIdealDifficulty(0, 0)).toBeGreaterThanOrEqual(0);
  });
});

describe('compareLearningPathCandidates', () => {
  it('orders by score descending first', () => {
    const a = { total: 80, taskNumber: 5, taskId: 'z' };
    const b = { total: 90, taskNumber: 1, taskId: 'a' };
    expect(compareLearningPathCandidates(a, b)).toBeGreaterThan(0); // b should sort first
  });

  it('breaks a score tie by taskNumber ascending', () => {
    const a = { total: 80, taskNumber: 5, taskId: 'z' };
    const b = { total: 80, taskNumber: 1, taskId: 'a' };
    expect(compareLearningPathCandidates(a, b)).toBeGreaterThan(0); // b (lower taskNumber) sorts first
  });

  it('breaks a score+taskNumber tie by taskId ascending', () => {
    const a = { total: 80, taskNumber: 5, taskId: 'zzz' };
    const b = { total: 80, taskNumber: 5, taskId: 'aaa' };
    expect(compareLearningPathCandidates(a, b)).toBeGreaterThan(0); // b (lower taskId) sorts first
  });

  it('is a strict total order — sorting is stable and deterministic regardless of input order', () => {
    const items = [
      { total: 50, taskNumber: 3, taskId: 'c' },
      { total: 90, taskNumber: 1, taskId: 'a' },
      { total: 90, taskNumber: 1, taskId: 'b' },
    ];
    const sortedOnce = [...items].sort(compareLearningPathCandidates);
    const sortedReversed = [...items].reverse().sort(compareLearningPathCandidates);
    expect(sortedOnce.map((i) => i.taskId)).toEqual(['a', 'b', 'c']);
    expect(sortedReversed.map((i) => i.taskId)).toEqual(['a', 'b', 'c']);
  });
});
