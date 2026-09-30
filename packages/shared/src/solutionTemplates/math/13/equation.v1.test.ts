import { describe, expect, it } from 'vitest';
import {
  SolutionTemplateRegistry,
  ValidationRuleRegistry,
  registerGenericValidators,
  runValidation,
  type CanonicalSolution,
  type ValidationContext,
} from '../../../solutionEngine/index.js';
import { mathTask13EquationTemplate, registerMathTask13Templates } from './equation.v1.js';

describe('math:13 equation template — structure', () => {
  it('has no method-specific or content-specific required/optional elements', () => {
    expect(mathTask13EquationTemplate.requiredElements).toEqual([
      'part_a_present',
      'part_b_present',
      'mathematically_justified_solution',
    ]);
    // Deliberately empty — domain/root-selection/method requirements
    // depend on a specific task's content, not on №13 as a category
    // (see module doc).
    expect(mathTask13EquationTemplate.optionalElements).toEqual([]);
  });

  it('never mandates a specific equation type or method', () => {
    const serialized = JSON.stringify(mathTask13EquationTemplate);
    for (const forbidden of [
      'trig',
      'logarithm',
      'exponent',
      'substitution',
      'factoring',
      'ОДЗ',
      'domain',
    ]) {
      expect(serialized.toLowerCase()).not.toContain(forbidden.toLowerCase());
    }
  });
});

describe('math:13 equation template — registration', () => {
  it('does not register on import — only when registerMathTask13Templates is called', () => {
    const registry = new SolutionTemplateRegistry();
    expect(registry.resolve('math:13')).toBeUndefined();
  });

  it('registers into a given registry via registerMathTask13Templates', () => {
    const registry = new SolutionTemplateRegistry();
    registerMathTask13Templates(registry);
    expect(registry.resolve('math:13')).toBe(mathTask13EquationTemplate);
  });
});

describe('math:13 equation template — validation pipeline', () => {
  function makeValidationRegistry(): ValidationRuleRegistry {
    const registry = new ValidationRuleRegistry();
    registerGenericValidators(registry);
    return registry;
  }

  it('passes for a solution with both parts and content', () => {
    const solution: CanonicalSolution = {
      taskId: 'task-13-real',
      templateId: mathTask13EquationTemplate.id,
      templateVersion: mathTask13EquationTemplate.version,
      parts: [
        {
          id: 'a',
          label: 'а)',
          hasCheckableAnswer: true,
          answer: 'x=πn, n∈ℤ; x=-2π/3+2πk, k∈ℤ',
          steps: [{ id: 'a1', title: 'Приводим к системе', explanation: '...' }],
        },
        {
          id: 'b',
          label: 'б)',
          hasCheckableAnswer: true,
          answer: '-4π; -3π; -8π/3',
          steps: [{ id: 'b1', title: 'Отбираем корни на отрезке', explanation: '...' }],
        },
      ],
    };
    const context: ValidationContext = { template: mathTask13EquationTemplate };
    const results = runValidation(
      solution,
      mathTask13EquationTemplate,
      context,
      makeValidationRegistry(),
    );

    expect(results.every((r) => r.passed)).toBe(true);
  });

  it('fails required-parts-present when part а) is missing — matches FIPI fact 3 (no answer to а → 0 points)', () => {
    const solution: CanonicalSolution = {
      taskId: 'task-13-real',
      templateId: mathTask13EquationTemplate.id,
      templateVersion: mathTask13EquationTemplate.version,
      parts: [
        {
          id: 'b',
          label: 'б)',
          hasCheckableAnswer: true,
          answer: '-4π; -3π; -8π/3',
          steps: [{ id: 'b1', title: 'Отбираем корни на отрезке', explanation: '...' }],
        },
      ],
    };
    const context: ValidationContext = { template: mathTask13EquationTemplate };
    const results = runValidation(
      solution,
      mathTask13EquationTemplate,
      context,
      makeValidationRegistry(),
    );

    const partsResult = results.find((r) => r.ruleId === 'has-both-parts');
    expect(partsResult?.passed).toBe(false);
    expect(partsResult?.message).toContain('a');
  });

  it('fails non-empty-steps when a part has no steps', () => {
    const solution: CanonicalSolution = {
      taskId: 'task-13-real',
      templateId: mathTask13EquationTemplate.id,
      templateVersion: mathTask13EquationTemplate.version,
      parts: [
        { id: 'a', label: 'а)', hasCheckableAnswer: true, steps: [] },
        { id: 'b', label: 'б)', hasCheckableAnswer: true, steps: [] },
      ],
    };
    const context: ValidationContext = { template: mathTask13EquationTemplate };
    const results = runValidation(
      solution,
      mathTask13EquationTemplate,
      context,
      makeValidationRegistry(),
    );

    const contentResult = results.find((r) => r.ruleId === 'has-content');
    expect(contentResult?.passed).toBe(false);
  });
});
