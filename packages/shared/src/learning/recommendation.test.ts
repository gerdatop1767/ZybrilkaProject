import { describe, expect, it } from 'vitest';
import {
  calculateDifficultyFit,
  calculateErrorRelevance,
  calculateExamImportance,
  calculateRecency,
  calculateSimilarityBonus,
  calculateSkillNeed,
  calculateTargetGap,
  calculateTargetRelevance,
  combineRecommendationSignals,
  RECOMMENDATION_WEIGHTS,
} from './recommendation.js';

describe('RECOMMENDATION_WEIGHTS', () => {
  it('sums to 100', () => {
    const sum = Object.values(RECOMMENDATION_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBe(100);
  });
});

describe('calculateSkillNeed', () => {
  it('is null for a task with no linked skills', () => {
    expect(calculateSkillNeed([])).toBeNull();
  });

  it('is 100 for a completely unpracticed skill (mastery 0)', () => {
    expect(calculateSkillNeed([0])).toBe(100);
  });

  it('is 0 for a fully mastered skill', () => {
    expect(calculateSkillNeed([100])).toBe(0);
  });

  it('averages across multiple linked skills', () => {
    expect(calculateSkillNeed([0, 100])).toBe(50);
  });
});

describe('calculateErrorRelevance', () => {
  it('is null when the user has zero recorded errors', () => {
    expect(calculateErrorRelevance([], 'short_answer')).toBeNull();
  });

  it('format_error is only relevant to interval tasks', () => {
    const stats = [{ errorSignature: 'format_error', count: 5 }];
    expect(calculateErrorRelevance(stats, 'interval')).toBe(100);
    expect(calculateErrorRelevance(stats, 'short_answer')).toBe(0);
  });

  it('incorrect_answer is relevant to every answer type', () => {
    const stats = [{ errorSignature: 'incorrect_answer', count: 3 }];
    expect(calculateErrorRelevance(stats, 'multiple_choice')).toBe(100);
  });

  it('part_incorrect:b is only relevant to multi_part', () => {
    const stats = [{ errorSignature: 'part_incorrect:b', count: 2 }];
    expect(calculateErrorRelevance(stats, 'multi_part')).toBe(100);
    expect(calculateErrorRelevance(stats, 'interval')).toBe(0);
  });

  it('is a proportional share, not all-or-nothing', () => {
    const stats = [
      { errorSignature: 'format_error', count: 2 },
      { errorSignature: 'incorrect_answer', count: 2 },
    ];
    // format_error irrelevant to short_answer, incorrect_answer always relevant: 2/4 = 50%.
    expect(calculateErrorRelevance(stats, 'short_answer')).toBe(50);
  });
});

describe('calculateDifficultyFit', () => {
  it('is null with no calibration point (no skill statistics in the subject)', () => {
    expect(calculateDifficultyFit(50, null)).toBeNull();
  });

  it('is 100 when task difficulty exactly matches user ability', () => {
    expect(calculateDifficultyFit(70, 70)).toBe(100);
  });

  it('decreases with distance from user ability', () => {
    expect(calculateDifficultyFit(90, 50)).toBe(60);
  });
});

describe('calculateTargetGap', () => {
  it('is null when either score is unknown', () => {
    expect(calculateTargetGap('unknown', '90_plus')).toBeNull();
    expect(calculateTargetGap('50_plus', 'unknown')).toBeNull();
  });

  it('computes a positive gap when target exceeds self-reported', () => {
    expect(calculateTargetGap('50_plus', '90_plus')).toBe(40);
  });

  it('clamps to 0 when self-reported already exceeds target', () => {
    expect(calculateTargetGap('90_plus', '60_plus')).toBe(0);
  });
});

describe('calculateTargetRelevance', () => {
  it('is null when gap is null', () => {
    expect(calculateTargetRelevance(null, 50)).toBeNull();
  });

  it('a large gap leans toward easier tasks scoring higher', () => {
    // gap=80 -> leanTowardHarder=20; an easy task (difficulty 20) fits best.
    expect(calculateTargetRelevance(80, 20)).toBe(100);
    expect(calculateTargetRelevance(80, 90)).toBeLessThan(50);
  });

  it('a small gap leans toward harder tasks scoring higher', () => {
    // gap=5 -> leanTowardHarder=95; a hard task (difficulty 95) fits best.
    expect(calculateTargetRelevance(5, 95)).toBe(100);
  });
});

describe('calculateRecency', () => {
  it('is null when none of the task skills have ever been attempted', () => {
    expect(calculateRecency([])).toBeNull();
  });

  it('ramps toward 100 as the most-overdue skill ages', () => {
    expect(calculateRecency([0])).toBe(0);
    expect(calculateRecency([14])).toBe(100);
    expect(calculateRecency([30])).toBe(100); // capped, never exceeds 100
  });

  it('uses the MOST overdue skill among several', () => {
    expect(calculateRecency([1, 14])).toBe(100);
  });
});

describe('calculateExamImportance', () => {
  it('is null for a task with no linked skills', () => {
    expect(calculateExamImportance([])).toBeNull();
  });

  it('reflects how common the skill is across the subject', () => {
    expect(calculateExamImportance([0.5])).toBe(50);
  });
});

describe('calculateSimilarityBonus', () => {
  it('is null when the user has no open mistakes in the subject', () => {
    expect(calculateSimilarityBonus([])).toBeNull();
  });

  it("is the highest similarity score among the user's open mistakes", () => {
    expect(calculateSimilarityBonus([20, 80, 45])).toBe(80);
  });
});

describe('combineRecommendationSignals', () => {
  it('is 0 when every signal is unavailable (honest floor, not a penalty)', () => {
    const result = combineRecommendationSignals({
      skillNeed: null,
      errorRelevance: null,
      difficultyFit: null,
      targetRelevance: null,
      recency: null,
      examImportance: null,
      similarityBonus: null,
    });
    expect(result.total).toBe(0);
    expect(Object.values(result.breakdown).every((b) => !b.included)).toBe(true);
  });

  it('is 100 when every available signal is maxed', () => {
    const result = combineRecommendationSignals({
      skillNeed: 100,
      errorRelevance: 100,
      difficultyFit: 100,
      targetRelevance: 100,
      recency: 100,
      examImportance: 100,
      similarityBonus: 100,
    });
    expect(result.total).toBe(100);
  });

  it('renormalizes over only the available signals, never padding a missing one with 0', () => {
    // Only skillNeed (35) and difficultyFit (15) available, both maxed:
    // weighted average should still be 100, not diluted by the missing weight.
    const result = combineRecommendationSignals({
      skillNeed: 100,
      errorRelevance: null,
      difficultyFit: 100,
      targetRelevance: null,
      recency: null,
      examImportance: null,
      similarityBonus: null,
    });
    expect(result.total).toBe(100);
    expect(result.breakdown.skillNeed.included).toBe(true);
    expect(result.breakdown.errorRelevance.included).toBe(false);
  });

  it('is deterministic — same input always produces the same output', () => {
    const input = {
      skillNeed: 72,
      errorRelevance: 30,
      difficultyFit: 55,
      targetRelevance: null,
      recency: 80,
      examImportance: 40,
      similarityBonus: null,
    } as const;
    expect(combineRecommendationSignals(input)).toEqual(combineRecommendationSignals(input));
  });
});
