import { describe, expect, it } from 'vitest';
import {
  SolutionTemplateRegistry,
  ValidationRuleRegistry,
  registerGenericValidators,
  runValidation,
  type CanonicalSolution,
  type ValidationContext,
} from '../../../solutionEngine/index.js';
import { mathTask17PlanimetryTemplate, registerMathTask17Templates } from './planimetry.v1.js';

describe('math:17 planimetry template — structure', () => {
  it('has no method-specific or content-specific required/optional elements', () => {
    expect(mathTask17PlanimetryTemplate.requiredElements).toEqual([
      'part_a_present',
      'part_b_present',
      'mathematically_justified_solution',
    ]);
    expect(mathTask17PlanimetryTemplate.optionalElements).toEqual([]);
  });

  it('never mandates the coordinate method or any other specific method/subtype', () => {
    const serialized = JSON.stringify(mathTask17PlanimetryTemplate);
    for (const forbidden of [
      'coordinate',
      'vector',
      'synthetic',
      'trapezoid',
      'incircle',
      'kite',
      'circle',
    ]) {
      expect(serialized.toLowerCase()).not.toContain(forbidden.toLowerCase());
    }
  });
});

describe('math:17 planimetry template — registration', () => {
  it('does not register on import — only when registerMathTask17Templates is called', () => {
    const registry = new SolutionTemplateRegistry();
    expect(registry.resolve('math:17')).toBeUndefined();
  });

  it('registers into a given registry via registerMathTask17Templates', () => {
    const registry = new SolutionTemplateRegistry();
    registerMathTask17Templates(registry);
    expect(registry.resolve('math:17')).toBe(mathTask17PlanimetryTemplate);
  });
});

describe('math:17 planimetry template — validation pipeline', () => {
  function makeValidationRegistry(): ValidationRuleRegistry {
    const registry = new ValidationRuleRegistry();
    registerGenericValidators(registry);
    return registry;
  }

  it('passes for a solution with both parts and content, even when part а) has no checkable answer (it is a proof)', () => {
    const solution: CanonicalSolution = {
      taskId: 'task-17-real',
      templateId: mathTask17PlanimetryTemplate.id,
      templateVersion: mathTask17PlanimetryTemplate.version,
      parts: [
        {
          id: 'a',
          label: 'а)',
          hasCheckableAnswer: false,
          steps: [{ id: 'a1', title: 'Вводим координаты', explanation: '...' }],
        },
        {
          id: 'b',
          label: 'б)',
          hasCheckableAnswer: true,
          answer: '6-3√2',
          steps: [{ id: 'b1', title: 'Находим точку касания G', explanation: '...' }],
        },
      ],
    };
    const context: ValidationContext = { template: mathTask17PlanimetryTemplate };
    const results = runValidation(
      solution,
      mathTask17PlanimetryTemplate,
      context,
      makeValidationRegistry(),
    );

    expect(results.every((r) => r.passed)).toBe(true);
  });

  it('fails required-parts-present when part а) (the proof) is missing', () => {
    const solution: CanonicalSolution = {
      taskId: 'task-17-real',
      templateId: mathTask17PlanimetryTemplate.id,
      templateVersion: mathTask17PlanimetryTemplate.version,
      parts: [
        {
          id: 'b',
          label: 'б)',
          hasCheckableAnswer: true,
          answer: '6-3√2',
          steps: [{ id: 'b1', title: 'Находим точку касания G', explanation: '...' }],
        },
      ],
    };
    const context: ValidationContext = { template: mathTask17PlanimetryTemplate };
    const results = runValidation(
      solution,
      mathTask17PlanimetryTemplate,
      context,
      makeValidationRegistry(),
    );

    const partsResult = results.find((r) => r.ruleId === 'has-both-parts');
    expect(partsResult?.passed).toBe(false);
    expect(partsResult?.message).toContain('a');
  });

  it('fails non-empty-steps when a part has no steps', () => {
    const solution: CanonicalSolution = {
      taskId: 'task-17-real',
      templateId: mathTask17PlanimetryTemplate.id,
      templateVersion: mathTask17PlanimetryTemplate.version,
      parts: [
        { id: 'a', label: 'а)', hasCheckableAnswer: false, steps: [] },
        { id: 'b', label: 'б)', hasCheckableAnswer: true, steps: [] },
      ],
    };
    const context: ValidationContext = { template: mathTask17PlanimetryTemplate };
    const results = runValidation(
      solution,
      mathTask17PlanimetryTemplate,
      context,
      makeValidationRegistry(),
    );

    const contentResult = results.find((r) => r.ruleId === 'has-content');
    expect(contentResult?.passed).toBe(false);
  });
});
