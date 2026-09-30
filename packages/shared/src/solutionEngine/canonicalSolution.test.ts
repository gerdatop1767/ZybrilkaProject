import { describe, expect, it } from 'vitest';
import { getPrimarySteps } from './canonicalSolution.js';
import type { CanonicalSolution } from './types.js';

const singleStep = [{ id: 's1', title: 'Step 1', explanation: 'Do the thing.' }];

describe('CanonicalSolution — only one active solution path for now', () => {
  it('is valid with a single part and no alternatives', () => {
    const solution: CanonicalSolution = {
      taskId: 'task-1',
      templateId: 'generic-template',
      templateVersion: '1.0.0',
      parts: [
        { id: 'main', label: 'Решение', steps: singleStep, hasCheckableAnswer: true, answer: '42' },
      ],
    };
    expect(getPrimarySteps(solution)).toEqual(singleStep);
  });

  it('flattens steps across multiple parts, in part order', () => {
    const partAStep = [{ id: 'a1', title: 'Part a step', explanation: '...' }];
    const partBStep = [{ id: 'b1', title: 'Part b step', explanation: '...' }];
    const solution: CanonicalSolution = {
      taskId: 'task-1',
      templateId: 'generic-template',
      templateVersion: '1.0.0',
      parts: [
        { id: 'a', label: 'а)', steps: partAStep, hasCheckableAnswer: true, answer: 'x=1' },
        { id: 'b', label: 'б)', steps: partBStep, hasCheckableAnswer: true, answer: 'x=2' },
      ],
    };
    expect(getPrimarySteps(solution)).toEqual([...partAStep, ...partBStep]);
  });

  it('ignores alternativeSolutions even when present — it is a placeholder, not active behavior', () => {
    const altPart = [
      { id: 'alt-a', label: 'а) (другой способ)', steps: singleStep, hasCheckableAnswer: true },
    ];
    const solution: CanonicalSolution = {
      taskId: 'task-1',
      templateId: 'generic-template',
      templateVersion: '1.0.0',
      parts: [{ id: 'main', label: 'Решение', steps: singleStep, hasCheckableAnswer: true }],
      alternativeSolutions: [altPart],
    };

    expect(getPrimarySteps(solution)).toEqual(singleStep);
  });
});
