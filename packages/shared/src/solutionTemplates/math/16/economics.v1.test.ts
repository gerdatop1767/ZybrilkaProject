import { describe, expect, it } from 'vitest';
import {
  SolutionTemplateRegistry,
  ValidationRuleRegistry,
  registerGenericValidators,
  runValidation,
  type CanonicalSolution,
  type ValidationContext,
} from '../../../solutionEngine/index.js';
import { mathTask16EconomicsTemplate, registerMathTask16Templates } from './economics.v1.js';

describe('math:16 economics template — structure', () => {
  it('has the task-category-genuine required elements (variables + model justification)', () => {
    expect(mathTask16EconomicsTemplate.requiredElements).toEqual([
      'variables_defined',
      'model_justified',
      'mathematically_justified_solution',
    ]);
    expect(mathTask16EconomicsTemplate.optionalElements).toEqual([]);
  });

  it('is a single-part structure, like №15', () => {
    expect(mathTask16EconomicsTemplate.solutionStructure.order).toEqual(['main']);
  });

  it('never mandates a specific economics subtype (credit/deposit/optimization)', () => {
    const serialized = JSON.stringify(mathTask16EconomicsTemplate);
    for (const forbidden of ['credit', 'deposit', 'optimization', 'кредит', 'вклад']) {
      expect(serialized.toLowerCase()).not.toContain(forbidden.toLowerCase());
    }
  });
});

describe('math:16 economics template — registration', () => {
  it('does not register on import — only when registerMathTask16Templates is called', () => {
    const registry = new SolutionTemplateRegistry();
    expect(registry.resolve('math:16')).toBeUndefined();
  });

  it('registers into a given registry via registerMathTask16Templates', () => {
    const registry = new SolutionTemplateRegistry();
    registerMathTask16Templates(registry);
    expect(registry.resolve('math:16')).toBe(mathTask16EconomicsTemplate);
  });
});

describe('math:16 economics template — validation pipeline', () => {
  function makeValidationRegistry(): ValidationRuleRegistry {
    const registry = new ValidationRuleRegistry();
    registerGenericValidators(registry);
    return registry;
  }

  it('passes for a single-part solution with content and a model_setup step', () => {
    const solution: CanonicalSolution = {
      taskId: 'task-16-real',
      templateId: mathTask16EconomicsTemplate.id,
      templateVersion: mathTask16EconomicsTemplate.version,
      parts: [
        {
          id: 'main',
          label: 'Решение',
          hasCheckableAnswer: true,
          answer: '5',
          steps: [
            { id: 's1', kind: 'model_setup', title: 'Вводим обозначение', explanation: '...' },
            { id: 's2', title: 'Решаем', explanation: '...' },
          ],
        },
      ],
    };
    const context: ValidationContext = { template: mathTask16EconomicsTemplate };
    const results = runValidation(
      solution,
      mathTask16EconomicsTemplate,
      context,
      makeValidationRegistry(),
    );

    expect(results.every((r) => r.passed)).toBe(true);
  });

  it('fails has-model-setup-step when no step is tagged model_setup — variables never defined', () => {
    const solution: CanonicalSolution = {
      taskId: 'task-16-real',
      templateId: mathTask16EconomicsTemplate.id,
      templateVersion: mathTask16EconomicsTemplate.version,
      parts: [
        {
          id: 'main',
          label: 'Решение',
          hasCheckableAnswer: true,
          answer: '5',
          steps: [{ id: 's1', title: 'Решаем', explanation: '...' }],
        },
      ],
    };
    const context: ValidationContext = { template: mathTask16EconomicsTemplate };
    const results = runValidation(
      solution,
      mathTask16EconomicsTemplate,
      context,
      makeValidationRegistry(),
    );

    const modelSetupResult = results.find((r) => r.ruleId === 'has-model-setup-step');
    expect(modelSetupResult?.passed).toBe(false);
  });

  it('fails non-empty-steps when the single part has no steps', () => {
    const solution: CanonicalSolution = {
      taskId: 'task-16-real',
      templateId: mathTask16EconomicsTemplate.id,
      templateVersion: mathTask16EconomicsTemplate.version,
      parts: [{ id: 'main', label: 'Решение', hasCheckableAnswer: true, steps: [] }],
    };
    const context: ValidationContext = { template: mathTask16EconomicsTemplate };
    const results = runValidation(
      solution,
      mathTask16EconomicsTemplate,
      context,
      makeValidationRegistry(),
    );

    const contentResult = results.find((r) => r.ruleId === 'has-content');
    expect(contentResult?.passed).toBe(false);
  });
});
