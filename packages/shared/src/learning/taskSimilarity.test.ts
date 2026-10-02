import { describe, expect, it } from 'vitest';
import {
  calculateTaskSimilarity,
  getComparableDifficulty,
  type TaskSimilarityInput,
} from './taskSimilarity.js';

function task(overrides: Partial<TaskSimilarityInput> & { taskId: string }): TaskSimilarityInput {
  return {
    subjectId: 'math',
    taskNumber: 13,
    topicId: 'topic-1',
    answerType: 'short_answer',
    skillIds: [],
    comparableDifficulty: 50,
    ...overrides,
  };
}

describe('calculateTaskSimilarity', () => {
  it('identical skill sets -> Jaccard 1.0 dominates a high score', () => {
    const a = task({ taskId: 'a', skillIds: ['s1', 's2', 's3'] });
    const b = task({ taskId: 'b', skillIds: ['s1', 's2', 's3'] });
    // skills(50) + topic(20, same) + taskNumber(10, same) + answerType(10, same) + difficulty(10, same) = 100
    expect(calculateTaskSimilarity(a, b)).toBe(100);
  });

  it('partial skill overlap ([a,b,c] vs [a,b]) gives Jaccard 2/3, reflected in the score', () => {
    const a = task({ taskId: 'a', skillIds: ['s1', 's2', 's3'], topicId: null });
    const b = task({ taskId: 'b', skillIds: ['s1', 's2'], topicId: null });
    // topic skipped (both null); remaining weights: skills 50, taskNumber 10, answerType 10, difficulty 10 = 80
    // skillScore = 2/3; taskNumber/answerType/difficulty all match (score 1)
    // weighted = (50*2/3 + 10*1 + 10*1 + 10*1) / 80 = (33.33+30)/80 = 0.7917 -> 79
    expect(calculateTaskSimilarity(a, b)).toBe(79);
  });

  it('disjoint skill sets ([a,b] vs [x,y]) give Jaccard 0, not treated as "unavailable"', () => {
    const a = task({ taskId: 'a', skillIds: ['s1', 's2'] });
    const b = task({ taskId: 'b', skillIds: ['x', 'y'] });
    const result = calculateTaskSimilarity(a, b);
    // skills(50, score 0) + topic(20,1) + taskNumber(10,1) + answerType(10,1) + difficulty(10,1)
    // = (0 + 20 + 10 + 10 + 10) / 100 = 0.5 -> 50
    expect(result).toBe(50);
  });

  it('a task with no skills does not read as completely dissimilar — the skill signal is skipped, not scored 0', () => {
    const withSkills = task({ taskId: 'a', skillIds: ['s1', 's2'] });
    const withoutSkills = task({ taskId: 'b', skillIds: [] });
    const result = calculateTaskSimilarity(withSkills, withoutSkills);
    // skill signal skipped entirely; remaining: topic(20,1)+taskNumber(10,1)+answerType(10,1)+difficulty(10,1) = 50/50 = 1.0 -> 100
    expect(result).toBe(100);
    expect(result).toBeGreaterThan(0);
  });

  it('different subjects always score 0, regardless of everything else matching', () => {
    const a = task({ taskId: 'a', subjectId: 'math', skillIds: ['s1'] });
    const b = task({ taskId: 'b', subjectId: 'russian', skillIds: ['s1'] });
    expect(calculateTaskSimilarity(a, b)).toBe(0);
  });

  it('a task compared to itself (same taskId) scores 0 (defensive — callers must exclude self)', () => {
    const a = task({ taskId: 'same', skillIds: ['s1'] });
    const b = task({ taskId: 'same', skillIds: ['s1'] });
    expect(calculateTaskSimilarity(a, b)).toBe(0);
  });

  it('is symmetric: score(A,B) === score(B,A)', () => {
    const a = task({ taskId: 'a', skillIds: ['s1', 's2'], taskNumber: 13 });
    const b = task({ taskId: 'b', skillIds: ['s2', 's3'], taskNumber: 17, topicId: 'topic-2' });
    expect(calculateTaskSimilarity(a, b)).toBe(calculateTaskSimilarity(b, a));
  });

  it('is deterministic: the same two inputs always give the same score', () => {
    const a = task({ taskId: 'a', skillIds: ['s1', 's2'] });
    const b = task({ taskId: 'b', skillIds: ['s2', 's3'] });
    expect(calculateTaskSimilarity(a, b)).toBe(calculateTaskSimilarity(a, b));
  });

  it('same taskNumber alone is never enough to dominate the score when nothing else matches', () => {
    const a = task({
      taskId: 'a',
      taskNumber: 13,
      skillIds: ['s1'],
      topicId: 't1',
      answerType: 'short_answer',
      comparableDifficulty: 10,
    });
    const b = task({
      taskId: 'b',
      taskNumber: 13,
      skillIds: ['x'],
      topicId: 't2',
      answerType: 'interval',
      comparableDifficulty: 90,
    });
    const result = calculateTaskSimilarity(a, b);
    // skills(50,0) + topic(20,0) + taskNumber(10,1) + answerType(10,0) + difficulty(10, 1-80/100=0.2)
    // = (0+0+10+0+2)/100 = 0.12 -> 12, far from "similar"
    expect(result).toBeLessThan(20);
  });

  it('never leaves the 0..100 range across a spread of inputs', () => {
    const variants: TaskSimilarityInput[] = [
      task({ taskId: 'a', skillIds: [], comparableDifficulty: 0 }),
      task({ taskId: 'b', skillIds: ['s1'], comparableDifficulty: 100 }),
      task({
        taskId: 'c',
        skillIds: ['s1', 's2', 's3', 's4'],
        topicId: null,
        comparableDifficulty: 50,
      }),
    ];
    for (const x of variants) {
      for (const y of variants) {
        if (x.taskId === y.taskId) continue;
        const score = calculateTaskSimilarity(x, y);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      }
    }
  });
});

describe('getComparableDifficulty', () => {
  it('uses observed difficulty when present, source "observed"', () => {
    const result = getComparableDifficulty({ authoredDifficulty: 2, observedDifficulty: 73 });
    expect(result).toEqual({ value: 73, source: 'observed' });
  });

  it('falls back to authored difficulty, mapped onto 0..100, when observed is null', () => {
    expect(getComparableDifficulty({ authoredDifficulty: 1, observedDifficulty: null })).toEqual({
      value: 25,
      source: 'authored',
    });
    expect(getComparableDifficulty({ authoredDifficulty: 2, observedDifficulty: null })).toEqual({
      value: 50,
      source: 'authored',
    });
    expect(getComparableDifficulty({ authoredDifficulty: 3, observedDifficulty: null })).toEqual({
      value: 75,
      source: 'authored',
    });
  });

  it('never blends observed and authored into one value', () => {
    const observedZero = getComparableDifficulty({ authoredDifficulty: 3, observedDifficulty: 0 });
    // 0 is a valid observed value (not "missing") and must be used as-is, not treated as falsy/null.
    expect(observedZero).toEqual({ value: 0, source: 'observed' });
  });
});
