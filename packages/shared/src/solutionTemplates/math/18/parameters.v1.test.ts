import { describe, expect, it } from 'vitest';
import {
  SolutionTemplateRegistry,
  ValidationRuleRegistry,
  registerGenericValidators,
  runValidation,
  type CanonicalSolution,
  type ValidationContext,
} from '../../../solutionEngine/index.js';
import { mathTask18ParametersTemplate, registerMathTask18Templates } from './parameters.v1.js';

describe('math:18 parameters template — structure', () => {
  it('has no subtype-specific or content-specific required/optional elements', () => {
    expect(mathTask18ParametersTemplate.requiredElements).toEqual([
      'parameter_and_variable_distinguished',
      'domain_stated',
      'critical_values_derived',
      'all_cases_covered',
      'mathematically_justified_solution',
    ]);
    expect(mathTask18ParametersTemplate.optionalElements).toEqual([]);
  });

  it('is a single-part structure, like №15/№16', () => {
    expect(mathTask18ParametersTemplate.solutionStructure.order).toEqual(['main']);
  });

  it('never mandates a specific equation/inequality/system subtype or method (algebraic vs graphical)', () => {
    const serialized = JSON.stringify(mathTask18ParametersTemplate);
    for (const forbidden of ['graphical', 'substitution', 'system of', 'cubic', 'absolute value']) {
      expect(serialized.toLowerCase()).not.toContain(forbidden.toLowerCase());
    }
  });
});

describe('math:18 parameters template — registration', () => {
  it('does not register on import — only when registerMathTask18Templates is called', () => {
    const registry = new SolutionTemplateRegistry();
    expect(registry.resolve('math:18')).toBeUndefined();
  });

  it('registers into a given registry via registerMathTask18Templates', () => {
    const registry = new SolutionTemplateRegistry();
    registerMathTask18Templates(registry);
    expect(registry.resolve('math:18')).toBe(mathTask18ParametersTemplate);
  });
});

describe('math:18 parameters template — validation pipeline', () => {
  function makeValidationRegistry(): ValidationRuleRegistry {
    const registry = new ValidationRuleRegistry();
    registerGenericValidators(registry);
    return registry;
  }

  it('passes for a single-part solution with content, a domain_check step, and a critical_value_derivation step', () => {
    const solution: CanonicalSolution = {
      taskId: 'task-18-real',
      templateId: mathTask18ParametersTemplate.id,
      templateVersion: mathTask18ParametersTemplate.version,
      parts: [
        {
          id: 'main',
          label: 'Решение',
          hasCheckableAnswer: true,
          answer: '36/25; (√13-2;4)',
          steps: [
            {
              id: 's1',
              kind: 'domain_check',
              title: 'Находим область значений a',
              explanation: '...',
            },
            {
              id: 's2',
              kind: 'critical_value_derivation',
              title: 'Находим критические значения',
              explanation: '...',
            },
          ],
        },
      ],
    };
    const context: ValidationContext = { template: mathTask18ParametersTemplate };
    const results = runValidation(
      solution,
      mathTask18ParametersTemplate,
      context,
      makeValidationRegistry(),
    );

    expect(results.every((r) => r.passed)).toBe(true);
  });

  it('fails has-domain-step when no step is tagged domain_check', () => {
    const solution: CanonicalSolution = {
      taskId: 'task-18-real',
      templateId: mathTask18ParametersTemplate.id,
      templateVersion: mathTask18ParametersTemplate.version,
      parts: [
        {
          id: 'main',
          label: 'Решение',
          hasCheckableAnswer: true,
          answer: '36/25; (√13-2;4)',
          steps: [
            {
              id: 's1',
              kind: 'critical_value_derivation',
              title: 'Находим критические значения',
              explanation: '...',
            },
          ],
        },
      ],
    };
    const context: ValidationContext = { template: mathTask18ParametersTemplate };
    const results = runValidation(
      solution,
      mathTask18ParametersTemplate,
      context,
      makeValidationRegistry(),
    );

    const domainResult = results.find((r) => r.ruleId === 'has-domain-step');
    expect(domainResult?.passed).toBe(false);
  });

  it('fails has-critical-value-step when no step is tagged critical_value_derivation', () => {
    const solution: CanonicalSolution = {
      taskId: 'task-18-real',
      templateId: mathTask18ParametersTemplate.id,
      templateVersion: mathTask18ParametersTemplate.version,
      parts: [
        {
          id: 'main',
          label: 'Решение',
          hasCheckableAnswer: true,
          answer: '36/25; (√13-2;4)',
          steps: [
            {
              id: 's1',
              kind: 'domain_check',
              title: 'Находим область значений a',
              explanation: '...',
            },
          ],
        },
      ],
    };
    const context: ValidationContext = { template: mathTask18ParametersTemplate };
    const results = runValidation(
      solution,
      mathTask18ParametersTemplate,
      context,
      makeValidationRegistry(),
    );

    const criticalValueResult = results.find((r) => r.ruleId === 'has-critical-value-step');
    expect(criticalValueResult?.passed).toBe(false);
  });

  it('fails non-empty-steps when the single part has no steps', () => {
    const solution: CanonicalSolution = {
      taskId: 'task-18-real',
      templateId: mathTask18ParametersTemplate.id,
      templateVersion: mathTask18ParametersTemplate.version,
      parts: [{ id: 'main', label: 'Решение', hasCheckableAnswer: true, steps: [] }],
    };
    const context: ValidationContext = { template: mathTask18ParametersTemplate };
    const results = runValidation(
      solution,
      mathTask18ParametersTemplate,
      context,
      makeValidationRegistry(),
    );

    const contentResult = results.find((r) => r.ruleId === 'has-content');
    expect(contentResult?.passed).toBe(false);
  });
});
