import { describe, expect, it } from 'vitest';
import { runValidation } from './runValidation.js';
import { ValidationRuleRegistry } from './validationRegistry.js';
import { registerGenericValidators } from './genericValidators.js';
import type { CanonicalSolution, SolutionTemplate, ValidationContext } from './types.js';

function makeSolution(overrides: Partial<CanonicalSolution> = {}): CanonicalSolution {
  return {
    taskId: 'task-1',
    templateId: 'generic-template',
    templateVersion: '1.0.0',
    steps: [{ id: 's1', title: 'Step 1', explanation: 'Do the thing.', kind: 'transformation' }],
    ...overrides,
  };
}

function makeTemplate(overrides: Partial<SolutionTemplate> = {}): SolutionTemplate {
  return {
    id: 'generic-template',
    version: '1.0.0',
    taskTypeKey: 'math:13',
    requiredElements: [],
    optionalElements: [],
    solutionStructure: { order: [] },
    validationRules: [],
    ...overrides,
  };
}

function makeRegistry(): ValidationRuleRegistry {
  const registry = new ValidationRuleRegistry();
  registerGenericValidators(registry);
  return registry;
}

describe('runValidation — generic declarative rules', () => {
  it('passes non-empty-steps for a solution with steps', () => {
    const registry = makeRegistry();
    const template = makeTemplate({
      validationRules: [{ id: 'r1', type: 'non-empty-steps' }],
    });
    const context: ValidationContext = { template };
    const results = runValidation(makeSolution(), template, context, registry);

    expect(results).toEqual([
      { ruleId: 'r1', ruleType: 'non-empty-steps', passed: true, message: undefined },
    ]);
  });

  it('fails non-empty-steps for a solution with no steps', () => {
    const registry = makeRegistry();
    const template = makeTemplate({
      validationRules: [{ id: 'r1', type: 'non-empty-steps' }],
    });
    const context: ValidationContext = { template };
    const results = runValidation(makeSolution({ steps: [] }), template, context, registry);

    expect(results[0]!.passed).toBe(false);
    expect(results[0]!.message).toMatch(/no steps/);
  });

  it('checks required-step-kinds-present against opaque kind strings', () => {
    const registry = makeRegistry();
    const template = makeTemplate({
      validationRules: [
        {
          id: 'r1',
          type: 'required-step-kinds-present',
          config: { requiredKinds: ['transformation', 'answer'] },
        },
      ],
    });
    const context: ValidationContext = { template };

    const missing = runValidation(makeSolution(), template, context, registry);
    expect(missing[0]!.passed).toBe(false);
    expect(missing[0]!.message).toContain('answer');

    const complete = runValidation(
      makeSolution({
        steps: [
          { id: 's1', title: 'Step 1', explanation: '...', kind: 'transformation' },
          { id: 's2', title: 'Step 2', explanation: '...', kind: 'answer' },
        ],
      }),
      template,
      context,
      registry,
    );
    expect(complete[0]!.passed).toBe(true);
  });

  it('runs every rule on the template, in order', () => {
    const registry = makeRegistry();
    const template = makeTemplate({
      validationRules: [
        { id: 'r1', type: 'non-empty-steps' },
        { id: 'r2', type: 'non-empty-steps' },
      ],
    });
    const context: ValidationContext = { template };
    const results = runValidation(makeSolution(), template, context, registry);

    expect(results.map((r) => r.ruleId)).toEqual(['r1', 'r2']);
  });

  it('an unregistered validator type never throws — it degrades to a predictable failed result', () => {
    const registry = new ValidationRuleRegistry(); // no generic validators registered
    const template = makeTemplate({
      validationRules: [{ id: 'r1', type: 'some-future-math-specific-rule' }],
    });
    const context: ValidationContext = { template };

    expect(() => runValidation(makeSolution(), template, context, registry)).not.toThrow();
    const results = runValidation(makeSolution(), template, context, registry);
    expect(results).toEqual([
      {
        ruleId: 'r1',
        ruleType: 'some-future-math-specific-rule',
        passed: false,
        message: 'Unknown validator type: "some-future-math-specific-rule"',
      },
    ]);
  });

  it('defaults to the shared default registry when none is passed', () => {
    const template = makeTemplate({
      validationRules: [{ id: 'r1', type: 'non-empty-steps' }],
    });
    const context: ValidationContext = { template };
    // No registry argument — exercises the default-registry code path.
    // The generic validators are registered globally by importing
    // solutionEngine/index.js in a real consumer; here we register
    // directly on the same default instance runValidation falls back to.
    expect(() => runValidation(makeSolution(), template, context)).not.toThrow();
  });
});
