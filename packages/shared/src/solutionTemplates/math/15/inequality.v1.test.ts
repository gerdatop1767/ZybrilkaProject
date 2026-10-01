import { describe, expect, it } from 'vitest';
import {
  SolutionTemplateRegistry,
  ValidationRuleRegistry,
  registerGenericValidators,
  runValidation,
  type CanonicalSolution,
  type ValidationContext,
} from '../../../solutionEngine/index.js';
import { mathTask15InequalityTemplate, registerMathTask15Templates } from './inequality.v1.js';

describe('math:15 inequality template — structure', () => {
  it('has no subtype-specific or content-specific required/optional elements', () => {
    expect(mathTask15InequalityTemplate.requiredElements).toEqual([
      'domain_present',
      'mathematically_justified_solution',
    ]);
    expect(mathTask15InequalityTemplate.optionalElements).toEqual([]);
  });

  it('is a single-part structure, unlike №13/№14', () => {
    expect(mathTask15InequalityTemplate.solutionStructure.order).toEqual(['main']);
  });

  it('never mandates a specific inequality subtype or method', () => {
    const serialized = JSON.stringify(mathTask15InequalityTemplate);
    for (const forbidden of [
      'logarithmic',
      'exponential',
      'rational',
      'substitution',
      'excluded point',
    ]) {
      expect(serialized.toLowerCase()).not.toContain(forbidden.toLowerCase());
    }
  });
});

describe('math:15 inequality template — registration', () => {
  it('does not register on import — only when registerMathTask15Templates is called', () => {
    const registry = new SolutionTemplateRegistry();
    expect(registry.resolve('math:15')).toBeUndefined();
  });

  it('registers into a given registry via registerMathTask15Templates', () => {
    const registry = new SolutionTemplateRegistry();
    registerMathTask15Templates(registry);
    expect(registry.resolve('math:15')).toBe(mathTask15InequalityTemplate);
  });
});

describe('math:15 inequality template — validation pipeline', () => {
  function makeValidationRegistry(): ValidationRuleRegistry {
    const registry = new ValidationRuleRegistry();
    registerGenericValidators(registry);
    return registry;
  }

  it('passes for a single-part solution with content and a domain_check step', () => {
    const solution: CanonicalSolution = {
      taskId: 'task-15-real',
      templateId: mathTask15InequalityTemplate.id,
      templateVersion: mathTask15InequalityTemplate.version,
      parts: [
        {
          id: 'main',
          label: 'Решение',
          hasCheckableAnswer: true,
          answer: '(log_5(2);log_5(8)) ∪ (log_5(8);log_3(8)]',
          steps: [
            { id: 's1', kind: 'domain_check', title: 'Находим ОДЗ', explanation: '...' },
            { id: 's2', title: 'Решаем неравенство', explanation: '...' },
          ],
        },
      ],
    };
    const context: ValidationContext = { template: mathTask15InequalityTemplate };
    const results = runValidation(
      solution,
      mathTask15InequalityTemplate,
      context,
      makeValidationRegistry(),
    );

    expect(results.every((r) => r.passed)).toBe(true);
  });

  it('fails has-domain-step when no step is tagged domain_check — a missing ОДЗ', () => {
    const solution: CanonicalSolution = {
      taskId: 'task-15-real',
      templateId: mathTask15InequalityTemplate.id,
      templateVersion: mathTask15InequalityTemplate.version,
      parts: [
        {
          id: 'main',
          label: 'Решение',
          hasCheckableAnswer: true,
          answer: '(log_5(2);log_5(8)) ∪ (log_5(8);log_3(8)]',
          steps: [{ id: 's1', title: 'Решаем неравенство', explanation: '...' }],
        },
      ],
    };
    const context: ValidationContext = { template: mathTask15InequalityTemplate };
    const results = runValidation(
      solution,
      mathTask15InequalityTemplate,
      context,
      makeValidationRegistry(),
    );

    const domainResult = results.find((r) => r.ruleId === 'has-domain-step');
    expect(domainResult?.passed).toBe(false);
  });

  it('fails non-empty-steps when the single part has no steps', () => {
    const solution: CanonicalSolution = {
      taskId: 'task-15-real',
      templateId: mathTask15InequalityTemplate.id,
      templateVersion: mathTask15InequalityTemplate.version,
      parts: [{ id: 'main', label: 'Решение', hasCheckableAnswer: true, steps: [] }],
    };
    const context: ValidationContext = { template: mathTask15InequalityTemplate };
    const results = runValidation(
      solution,
      mathTask15InequalityTemplate,
      context,
      makeValidationRegistry(),
    );

    const contentResult = results.find((r) => r.ruleId === 'has-content');
    expect(contentResult?.passed).toBe(false);
  });
});
