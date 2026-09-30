import { describe, expect, it } from 'vitest';
import { getPrimarySteps } from './canonicalSolution.js';
import type { CanonicalSolution } from './types.js';

const singleStep = [{ id: 's1', title: 'Step 1', explanation: 'Do the thing.' }];

describe('CanonicalSolution — only one active solution path for now', () => {
  it('is valid with just a single canonical `steps` path, no alternatives', () => {
    const solution: CanonicalSolution = {
      taskId: 'task-1',
      templateId: 'generic-template',
      templateVersion: '1.0.0',
      steps: singleStep,
    };
    expect(getPrimarySteps(solution)).toBe(solution.steps);
  });

  it('ignores alternativeSolutions even when present — it is a placeholder, not active behavior', () => {
    const altStep = [{ id: 'alt-1', title: 'Alt step', explanation: 'A different way.' }];
    const solution: CanonicalSolution = {
      taskId: 'task-1',
      templateId: 'generic-template',
      templateVersion: '1.0.0',
      steps: singleStep,
      alternativeSolutions: [altStep],
    };

    expect(getPrimarySteps(solution)).toBe(solution.steps);
    expect(getPrimarySteps(solution)).not.toBe(altStep);
  });
});
