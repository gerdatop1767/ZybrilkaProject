import { describe, expect, it } from 'vitest';
import {
  buildTaskTypeKey,
  runCanonicalSolutionPipeline,
  type TaskTypeContext,
} from './pipeline.js';
import { SolutionTemplateRegistry } from './templateRegistry.js';
import { ValidationRuleRegistry } from './validationRegistry.js';
import { registerGenericValidators } from './genericValidators.js';
import type { CanonicalSolution, SolutionTemplate } from './types.js';

function makeTemplate(overrides: Partial<SolutionTemplate> = {}): SolutionTemplate {
  return {
    id: 'generic-template',
    version: '1.0.0',
    taskTypeKey: 'math:13',
    requiredElements: [],
    optionalElements: [],
    solutionStructure: { order: [] },
    validationRules: [{ id: 'r1', type: 'non-empty-steps' }],
    ...overrides,
  };
}

function makeSolution(overrides: Partial<CanonicalSolution> = {}): CanonicalSolution {
  return {
    taskId: 'task-1',
    templateId: 'generic-template',
    templateVersion: '1.0.0',
    parts: [
      {
        id: 'main',
        label: 'Решение',
        hasCheckableAnswer: true,
        steps: [{ id: 's1', title: 'Step', explanation: '...' }],
      },
    ],
    ...overrides,
  };
}

function makeValidationRegistry(): ValidationRuleRegistry {
  const registry = new ValidationRuleRegistry();
  registerGenericValidators(registry);
  return registry;
}

describe('buildTaskTypeKey', () => {
  it('composes subjectId:taskNumber generically, for any subject', () => {
    expect(buildTaskTypeKey({ id: 't1', subjectId: 'math', taskNumber: 13 })).toBe('math:13');
    expect(buildTaskTypeKey({ id: 't2', subjectId: 'rus', taskNumber: 27 })).toBe('rus:27');
  });
});

describe('runCanonicalSolutionPipeline', () => {
  const task: TaskTypeContext = { id: 'task-1', subjectId: 'math', taskNumber: 13 };

  it('resolves a template and validates a passing canonical solution', () => {
    const templateRegistry = new SolutionTemplateRegistry();
    const template = makeTemplate();
    templateRegistry.register(template);

    const result = runCanonicalSolutionPipeline(task, makeSolution(), {
      templateRegistry,
      validationRegistry: makeValidationRegistry(),
    });

    expect(result.status).toBe('validated');
    expect(result.template).toBe(template);
    expect(result.validationResults).toHaveLength(1);
    expect(result.validationResults[0]!.passed).toBe(true);
  });

  it('reports validation_failed without throwing when a rule fails', () => {
    const templateRegistry = new SolutionTemplateRegistry();
    templateRegistry.register(makeTemplate());

    const result = runCanonicalSolutionPipeline(
      task,
      makeSolution({
        parts: [{ id: 'main', label: 'Решение', hasCheckableAnswer: true, steps: [] }],
      }),
      { templateRegistry, validationRegistry: makeValidationRegistry() },
    );

    expect(result.status).toBe('validation_failed');
    expect(result.validationResults[0]!.passed).toBe(false);
  });

  it('(G) a task with no registered template never breaks — returns no_template, never throws', () => {
    const templateRegistry = new SolutionTemplateRegistry(); // empty — nothing registered
    const otherTask: TaskTypeContext = { id: 'task-2', subjectId: 'math', taskNumber: 7 };

    expect(() =>
      runCanonicalSolutionPipeline(otherTask, makeSolution(), { templateRegistry }),
    ).not.toThrow();
    const result = runCanonicalSolutionPipeline(otherTask, makeSolution(), { templateRegistry });
    expect(result.status).toBe('no_template');
    expect(result.template).toBeUndefined();
    expect(result.canonicalSolution).toBeUndefined();
    expect(result.validationResults).toEqual([]);
  });

  it('a task with no canonicalSolution (undefined) also returns no_template, never throws', () => {
    const templateRegistry = new SolutionTemplateRegistry();
    templateRegistry.register(makeTemplate());

    expect(() => runCanonicalSolutionPipeline(task, undefined, { templateRegistry })).not.toThrow();
    const result = runCanonicalSolutionPipeline(task, undefined, { templateRegistry });
    expect(result.status).toBe('no_template');
  });

  it('(F) an unknown task type/subtype never falls back to an unrelated registered template', () => {
    const templateRegistry = new SolutionTemplateRegistry();
    templateRegistry.register(makeTemplate({ taskTypeKey: 'math:13' }));

    const unrelatedTask: TaskTypeContext = { id: 'task-3', subjectId: 'rus', taskNumber: 27 };
    const result = runCanonicalSolutionPipeline(unrelatedTask, makeSolution(), {
      templateRegistry,
    });

    expect(result.status).toBe('no_template');
    expect(result.template).toBeUndefined();
  });

  it('(F) an unknown subtypeId for a known taskTypeKey never resolves a template registered under a different subtype', () => {
    const templateRegistry = new SolutionTemplateRegistry();
    templateRegistry.register(makeTemplate({ subtypeId: 'known_subtype' }));

    const result = runCanonicalSolutionPipeline(task, makeSolution(), {
      templateRegistry,
      subtypeId: 'unknown_subtype',
    });

    expect(result.status).toBe('no_template');
  });
});
