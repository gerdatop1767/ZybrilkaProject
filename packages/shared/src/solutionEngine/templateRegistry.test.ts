import { describe, expect, it } from 'vitest';
import { SolutionTemplateRegistry } from './templateRegistry.js';
import type { SolutionTemplate } from './types.js';

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

describe('SolutionTemplate shape', () => {
  it('can be constructed with no math-specific fields at all', () => {
    // Nothing here beyond the generic interface — no domain/geometry/
    // parameter concept, no trig-specific field.
    const template = makeTemplate();
    expect(template.taskTypeKey).toBe('math:13');
    expect(template.requiredElements).toEqual([]);
  });
});

describe('SolutionTemplateRegistry', () => {
  it('registers a template', () => {
    const registry = new SolutionTemplateRegistry();
    const template = makeTemplate();
    registry.register(template);
    expect(registry.listForTaskType('math:13')).toEqual([template]);
  });

  it('resolves a template by taskTypeKey', () => {
    const registry = new SolutionTemplateRegistry();
    const template = makeTemplate({ taskTypeKey: 'math:14' });
    registry.register(template);
    expect(registry.resolve('math:14')).toBe(template);
  });

  it('returns undefined for an unregistered taskTypeKey', () => {
    const registry = new SolutionTemplateRegistry();
    expect(registry.resolve('rus:27')).toBeUndefined();
  });

  it('supports subtypeId — distinct subtypes resolve independently', () => {
    const registry = new SolutionTemplateRegistry();
    const trig = makeTemplate({ id: 'trig', subtypeId: 'trig_with_domain' });
    const log = makeTemplate({ id: 'log', subtypeId: 'log_equation' });
    registry.register(trig);
    registry.register(log);

    expect(registry.resolve('math:13', 'trig_with_domain')).toBe(trig);
    expect(registry.resolve('math:13', 'log_equation')).toBe(log);
    expect(registry.resolve('math:13', 'unknown_subtype')).toBeUndefined();
  });

  it('a template with no subtypeId only resolves when no subtypeId is requested', () => {
    const registry = new SolutionTemplateRegistry();
    const noSubtype = makeTemplate({ id: 'no-subtype' });
    registry.register(noSubtype);

    expect(registry.resolve('math:13')).toBe(noSubtype);
    expect(registry.resolve('math:13', 'some_subtype')).toBeUndefined();
  });

  it('last-registered template wins for the same taskTypeKey/subtypeId', () => {
    const registry = new SolutionTemplateRegistry();
    const first = makeTemplate({ id: 'first', version: '1.0.0' });
    const second = makeTemplate({ id: 'second', version: '2.0.0' });
    registry.register(first);
    registry.register(second);

    expect(registry.resolve('math:13')).toBe(second);
    expect(registry.listForTaskType('math:13')).toEqual([first, second]);
  });

  it('different subjects/task numbers never require changing this registry', () => {
    const registry = new SolutionTemplateRegistry();
    registry.register(makeTemplate({ taskTypeKey: 'math:13' }));
    registry.register(makeTemplate({ taskTypeKey: 'math:14' }));
    registry.register(makeTemplate({ taskTypeKey: 'rus:27' }));

    expect(registry.resolve('math:13')).toBeDefined();
    expect(registry.resolve('math:14')).toBeDefined();
    expect(registry.resolve('rus:27')).toBeDefined();
  });
});
