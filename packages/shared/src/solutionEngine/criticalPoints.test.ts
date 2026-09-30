import { describe, expect, it } from 'vitest';
import { checkCriticalPoints } from './criticalPoints.js';
import type { CanonicalSolution, ExamCriticalPoint, ValidationResult } from './types.js';

function makeSolution(criticalPoints: readonly ExamCriticalPoint[]): CanonicalSolution {
  return {
    taskId: 'task-1',
    templateId: 'generic-template',
    templateVersion: '1.0.0',
    parts: [{ id: 'main', label: 'Решение', hasCheckableAnswer: true, steps: [] }],
    criticalPoints,
  };
}

describe('checkCriticalPoints', () => {
  it('(E) a point with no validationRuleId (typical for presentation/informational points) is unlinked, never satisfied/not_satisfied', () => {
    const point: ExamCriticalPoint = {
      id: 'free-form',
      text: 'Метод решения может быть произвольным.',
      category: 'presentation',
      required: false,
      source: 'fipi_verified',
    };
    const results = checkCriticalPoints(makeSolution([point]), []);
    expect(results).toEqual([{ criticalPointId: 'free-form', status: 'unlinked' }]);
  });

  it('(C) a required structural point is satisfied when its referenced rule passed', () => {
    const point: ExamCriticalPoint = {
      id: 'has-parts',
      text: 'Обе части задания должны быть представлены.',
      category: 'exam_scoring',
      required: true,
      validationRuleId: 'has-both-parts',
      source: 'fipi_verified',
    };
    const passingResult: ValidationResult = {
      ruleId: 'has-both-parts',
      ruleType: 'required-parts-present',
      passed: true,
    };
    const results = checkCriticalPoints(makeSolution([point]), [passingResult]);

    expect(results).toEqual([
      { criticalPointId: 'has-parts', status: 'satisfied', relatedValidationResult: passingResult },
    ]);
  });

  it('(D) a required structural point is not_satisfied, predictably, when its referenced rule failed — never throws', () => {
    const point: ExamCriticalPoint = {
      id: 'has-parts',
      text: 'Обе части задания должны быть представлены.',
      category: 'exam_scoring',
      required: true,
      validationRuleId: 'has-both-parts',
      source: 'fipi_verified',
    };
    const failingResult: ValidationResult = {
      ruleId: 'has-both-parts',
      ruleType: 'required-parts-present',
      passed: false,
      message: 'Missing required part(s): a',
    };

    expect(() => checkCriticalPoints(makeSolution([point]), [failingResult])).not.toThrow();
    const results = checkCriticalPoints(makeSolution([point]), [failingResult]);
    expect(results).toEqual([
      {
        criticalPointId: 'has-parts',
        status: 'not_satisfied',
        relatedValidationResult: failingResult,
      },
    ]);
  });

  it('(F) an unresolvable validationRuleId (references a rule that never ran) degrades predictably, never throws', () => {
    const point: ExamCriticalPoint = {
      id: 'orphaned',
      text: 'Ссылается на несуществующее правило.',
      category: 'correctness',
      required: true,
      validationRuleId: 'rule-that-does-not-exist',
      source: 'project_quality_rule',
    };
    expect(() => checkCriticalPoints(makeSolution([point]), [])).not.toThrow();
    const results = checkCriticalPoints(makeSolution([point]), []);
    expect(results).toEqual([{ criticalPointId: 'orphaned', status: 'unresolvable_rule' }]);
  });

  it('returns an empty array when the solution has no criticalPoints at all', () => {
    const solution: CanonicalSolution = {
      taskId: 'task-1',
      templateId: 'generic-template',
      templateVersion: '1.0.0',
      parts: [{ id: 'main', label: 'Решение', hasCheckableAnswer: true, steps: [] }],
    };
    expect(checkCriticalPoints(solution, [])).toEqual([]);
  });
});
