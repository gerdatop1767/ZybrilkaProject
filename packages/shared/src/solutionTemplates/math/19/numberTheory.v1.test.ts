import { describe, expect, it } from 'vitest';
import {
  SolutionTemplateRegistry,
  ValidationRuleRegistry,
  registerGenericValidators,
  runValidation,
  type CanonicalSolution,
  type ValidationContext,
} from '../../../solutionEngine/index.js';
import { mathTask19NumberTheoryTemplate, registerMathTask19Templates } from './numberTheory.v1.js';

describe('math:19 number-theory template — structure', () => {
  it('has no subtype-specific or content-specific required/optional elements', () => {
    expect(mathTask19NumberTheoryTemplate.requiredElements).toEqual([
      'part_a_present',
      'part_b_present',
      'part_c_present',
      'mathematically_justified_solution',
    ]);
    expect(mathTask19NumberTheoryTemplate.optionalElements).toEqual([]);
  });

  it("is a three-part structure (а/б/в), unlike №13/№14/№17's two parts", () => {
    expect(mathTask19NumberTheoryTemplate.solutionStructure.order).toEqual(['a', 'b', 'c']);
  });

  it('never mandates a specific number-theory subtype or proof method', () => {
    const serialized = JSON.stringify(mathTask19NumberTheoryTemplate);
    for (const forbidden of ['divisibility', 'coin', 'binder', 'кляссер', 'bounding']) {
      expect(serialized.toLowerCase()).not.toContain(forbidden.toLowerCase());
    }
  });
});

describe('math:19 number-theory template — registration', () => {
  it('does not register on import — only when registerMathTask19Templates is called', () => {
    const registry = new SolutionTemplateRegistry();
    expect(registry.resolve('math:19')).toBeUndefined();
  });

  it('registers into a given registry via registerMathTask19Templates', () => {
    const registry = new SolutionTemplateRegistry();
    registerMathTask19Templates(registry);
    expect(registry.resolve('math:19')).toBe(mathTask19NumberTheoryTemplate);
  });
});

describe('math:19 number-theory template — validation pipeline', () => {
  function makeValidationRegistry(): ValidationRuleRegistry {
    const registry = new ValidationRuleRegistry();
    registerGenericValidators(registry);
    return registry;
  }

  function solutionWithParts(
    extra: Partial<{ bound: boolean; exhaustive: boolean; empty: boolean }> = {},
  ): CanonicalSolution {
    const { bound = true, exhaustive = true, empty = false } = extra;
    return {
      taskId: 'task-19-real',
      templateId: mathTask19NumberTheoryTemplate.id,
      templateVersion: mathTask19NumberTheoryTemplate.version,
      parts: [
        {
          id: 'a',
          label: 'а)',
          hasCheckableAnswer: true,
          answer: 'нет',
          steps: empty
            ? []
            : [
                { id: 'a1', title: 'Составляем уравнение', explanation: '...' },
                ...(bound
                  ? [{ id: 'a2', kind: 'bound_derivation', title: 'Границы k', explanation: '...' }]
                  : []),
              ],
        },
        {
          id: 'b',
          label: 'б)',
          hasCheckableAnswer: true,
          answer: '607',
          steps: [
            ...(exhaustive
              ? [
                  {
                    id: 'b1',
                    kind: 'exhaustive_case_check',
                    title: 'Случай k=4',
                    explanation: '...',
                  },
                ]
              : []),
          ],
        },
        {
          id: 'c',
          label: 'в)',
          hasCheckableAnswer: true,
          answer: '1066',
          steps: [{ id: 'c1', title: 'Случай k=7', explanation: '...' }],
        },
      ],
    };
  }

  it('passes for a solution with all three parts, a bound_derivation step, and an exhaustive_case_check step', () => {
    const solution = solutionWithParts();
    const context: ValidationContext = { template: mathTask19NumberTheoryTemplate };
    const results = runValidation(
      solution,
      mathTask19NumberTheoryTemplate,
      context,
      makeValidationRegistry(),
    );

    expect(results.every((r) => r.passed)).toBe(true);
  });

  it('fails has-all-parts when part в) (c) is missing', () => {
    const solution = solutionWithParts();
    const withoutC = { ...solution, parts: solution.parts.filter((p) => p.id !== 'c') };
    const context: ValidationContext = { template: mathTask19NumberTheoryTemplate };
    const results = runValidation(
      withoutC,
      mathTask19NumberTheoryTemplate,
      context,
      makeValidationRegistry(),
    );

    const partsResult = results.find((r) => r.ruleId === 'has-all-parts');
    expect(partsResult?.passed).toBe(false);
    expect(partsResult?.message).toContain('c');
  });

  it('fails has-bound-derivation-step when no step is tagged bound_derivation', () => {
    const solution = solutionWithParts({ bound: false });
    const context: ValidationContext = { template: mathTask19NumberTheoryTemplate };
    const results = runValidation(
      solution,
      mathTask19NumberTheoryTemplate,
      context,
      makeValidationRegistry(),
    );

    const result = results.find((r) => r.ruleId === 'has-bound-derivation-step');
    expect(result?.passed).toBe(false);
  });

  it('fails has-exhaustive-case-check-step when no step is tagged exhaustive_case_check', () => {
    const solution = solutionWithParts({ exhaustive: false });
    const context: ValidationContext = { template: mathTask19NumberTheoryTemplate };
    const results = runValidation(
      solution,
      mathTask19NumberTheoryTemplate,
      context,
      makeValidationRegistry(),
    );

    const result = results.find((r) => r.ruleId === 'has-exhaustive-case-check-step');
    expect(result?.passed).toBe(false);
  });

  it('fails non-empty-steps when every part has no steps', () => {
    const solution: CanonicalSolution = {
      taskId: 'task-19-real',
      templateId: mathTask19NumberTheoryTemplate.id,
      templateVersion: mathTask19NumberTheoryTemplate.version,
      parts: [
        { id: 'a', label: 'а)', hasCheckableAnswer: true, answer: 'нет', steps: [] },
        { id: 'b', label: 'б)', hasCheckableAnswer: true, answer: '607', steps: [] },
        { id: 'c', label: 'в)', hasCheckableAnswer: true, answer: '1066', steps: [] },
      ],
    };
    const context: ValidationContext = { template: mathTask19NumberTheoryTemplate };
    const results = runValidation(
      solution,
      mathTask19NumberTheoryTemplate,
      context,
      makeValidationRegistry(),
    );

    const contentResult = results.find((r) => r.ruleId === 'has-content');
    expect(contentResult?.passed).toBe(false);
  });
});
