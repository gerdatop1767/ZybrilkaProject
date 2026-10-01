import { describe, expect, it } from 'vitest';
import {
  SolutionTemplateRegistry,
  ValidationRuleRegistry,
  registerGenericValidators,
  runValidation,
  type CanonicalSolution,
  type ValidationContext,
} from '../../../solutionEngine/index.js';
import { mathTask14StereometryTemplate, registerMathTask14Templates } from './stereometry.v1.js';

describe('math:14 stereometry template — structure', () => {
  it('has no method-specific or content-specific required/optional elements', () => {
    expect(mathTask14StereometryTemplate.requiredElements).toEqual([
      'part_a_present',
      'part_b_present',
      'mathematically_justified_solution',
    ]);
    expect(mathTask14StereometryTemplate.optionalElements).toEqual([]);
  });

  it('never mandates the coordinate method or any other specific method', () => {
    const serialized = JSON.stringify(mathTask14StereometryTemplate);
    for (const forbidden of [
      'coordinate',
      'vector',
      'synthetic',
      'projection',
      'volume',
      'pyramid',
    ]) {
      expect(serialized.toLowerCase()).not.toContain(forbidden.toLowerCase());
    }
  });
});

describe('math:14 stereometry template — registration', () => {
  it('does not register on import — only when registerMathTask14Templates is called', () => {
    const registry = new SolutionTemplateRegistry();
    expect(registry.resolve('math:14')).toBeUndefined();
  });

  it('registers into a given registry via registerMathTask14Templates', () => {
    const registry = new SolutionTemplateRegistry();
    registerMathTask14Templates(registry);
    expect(registry.resolve('math:14')).toBe(mathTask14StereometryTemplate);
  });
});

describe('math:14 stereometry template — validation pipeline', () => {
  function makeValidationRegistry(): ValidationRuleRegistry {
    const registry = new ValidationRuleRegistry();
    registerGenericValidators(registry);
    return registry;
  }

  it('passes for a solution with both parts and content, even when part а) has no checkable answer (it is a proof)', () => {
    const solution: CanonicalSolution = {
      taskId: 'task-14-real',
      templateId: mathTask14StereometryTemplate.id,
      templateVersion: mathTask14StereometryTemplate.version,
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
          answer: 'arccos(√10/5)',
          steps: [{ id: 'b1', title: 'Находим направляющие векторы', explanation: '...' }],
        },
      ],
    };
    const context: ValidationContext = { template: mathTask14StereometryTemplate };
    const results = runValidation(
      solution,
      mathTask14StereometryTemplate,
      context,
      makeValidationRegistry(),
    );

    expect(results.every((r) => r.passed)).toBe(true);
  });

  it('fails required-parts-present when part а) (the proof) is missing', () => {
    const solution: CanonicalSolution = {
      taskId: 'task-14-real',
      templateId: mathTask14StereometryTemplate.id,
      templateVersion: mathTask14StereometryTemplate.version,
      parts: [
        {
          id: 'b',
          label: 'б)',
          hasCheckableAnswer: true,
          answer: 'arccos(√10/5)',
          steps: [{ id: 'b1', title: 'Находим направляющие векторы', explanation: '...' }],
        },
      ],
    };
    const context: ValidationContext = { template: mathTask14StereometryTemplate };
    const results = runValidation(
      solution,
      mathTask14StereometryTemplate,
      context,
      makeValidationRegistry(),
    );

    const partsResult = results.find((r) => r.ruleId === 'has-both-parts');
    expect(partsResult?.passed).toBe(false);
    expect(partsResult?.message).toContain('a');
  });

  it('fails non-empty-steps when a part has no steps', () => {
    const solution: CanonicalSolution = {
      taskId: 'task-14-real',
      templateId: mathTask14StereometryTemplate.id,
      templateVersion: mathTask14StereometryTemplate.version,
      parts: [
        { id: 'a', label: 'а)', hasCheckableAnswer: false, steps: [] },
        { id: 'b', label: 'б)', hasCheckableAnswer: true, steps: [] },
      ],
    };
    const context: ValidationContext = { template: mathTask14StereometryTemplate };
    const results = runValidation(
      solution,
      mathTask14StereometryTemplate,
      context,
      makeValidationRegistry(),
    );

    const contentResult = results.find((r) => r.ruleId === 'has-content');
    expect(contentResult?.passed).toBe(false);
  });
});
