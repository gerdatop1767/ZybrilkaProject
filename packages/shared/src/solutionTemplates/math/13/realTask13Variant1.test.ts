import { describe, expect, it } from 'vitest';
import {
  SolutionTemplateRegistry,
  ValidationRuleRegistry,
  registerGenericValidators,
  runCanonicalSolutionPipeline,
  type TaskTypeContext,
} from '../../../solutionEngine/index.js';
import { mathTask13EquationTemplate, registerMathTask13Templates } from './equation.v1.js';
import { buildCanonicalSolutionForTask13Variant1 } from './realTask13Variant1.js';

// Real field values, copied verbatim from
// packages/db/src/importEge2026Variant1.ts (taskNumber: 13) — not
// invented for this test. A stable test UUID stands in for the real
// DB-generated id, which doesn't exist until the row is inserted.
const REAL_TASK_13_ID = '00000000-0000-0000-0000-000000000013';
const realTask13Fields = {
  taskId: REAL_TASK_13_ID,
  correctAnswer: '-4π; -3π; -8π/3',
  correctAnswerDisplay: '$-4\\pi;\\ -3\\pi;\\ -\\dfrac{8\\pi}{3}$',
};

function makeRegistries() {
  const templateRegistry = new SolutionTemplateRegistry();
  registerMathTask13Templates(templateRegistry);
  const validationRegistry = new ValidationRuleRegistry();
  registerGenericValidators(validationRegistry);
  return { templateRegistry, validationRegistry };
}

describe('real task 13 — full pipeline', () => {
  const task: TaskTypeContext = { id: REAL_TASK_13_ID, subjectId: 'math', taskNumber: 13 };

  it('(A) resolves to the math:13 equation template', () => {
    const { templateRegistry } = makeRegistries();
    expect(templateRegistry.resolve('math:13')).toBe(mathTask13EquationTemplate);
  });

  it('(B) builds a CanonicalSolution with exactly two parts (a, b)', () => {
    const solution = buildCanonicalSolutionForTask13Variant1(realTask13Fields);
    expect(solution.parts.map((p) => p.id)).toEqual(['a', 'b']);
  });

  it('(C) each part contains the expected canonical steps (real content, not placeholders)', () => {
    const solution = buildCanonicalSolutionForTask13Variant1(realTask13Fields);
    const partA = solution.parts.find((p) => p.id === 'a')!;
    const partB = solution.parts.find((p) => p.id === 'b')!;

    expect(partA.steps.map((s) => s.title)).toEqual([
      'Приводим к системе',
      'Упрощаем уравнение',
      'Решаем кубическое уравнение относительно cos x',
      'Проверяем условие sin x ⩽ 0',
    ]);
    expect(partB.steps.map((s) => s.title)).toEqual(['Отбираем корни на заданном отрезке']);

    // part б)'s answer is the task's real correctAnswer, not re-typed.
    expect(partB.answer).toBe(realTask13Fields.correctAnswer);
    expect(partB.answerDisplay).toBe(realTask13Fields.correctAnswerDisplay);
  });

  it('(D) template id/version are recorded on the built CanonicalSolution', () => {
    const solution = buildCanonicalSolutionForTask13Variant1(realTask13Fields);
    expect(solution.templateId).toBe(mathTask13EquationTemplate.id);
    expect(solution.templateVersion).toBe(mathTask13EquationTemplate.version);
  });

  it('(E) the full pipeline resolves the template, builds the solution, and validation passes', () => {
    const { templateRegistry, validationRegistry } = makeRegistries();
    const canonicalSolution = buildCanonicalSolutionForTask13Variant1(realTask13Fields);

    const result = runCanonicalSolutionPipeline(task, canonicalSolution, {
      templateRegistry,
      validationRegistry,
    });

    expect(result.status).toBe('validated');
    expect(result.template).toBe(mathTask13EquationTemplate);
    expect(result.canonicalSolution).toBe(canonicalSolution);
    expect(result.validationResults.every((r) => r.passed)).toBe(true);
    // Confirms the specific rules from the template actually ran, not
    // just "some rules, who knows which".
    expect(result.validationResults.map((r) => r.ruleId).sort()).toEqual(
      ['has-both-parts', 'has-content'].sort(),
    );
  });

  it('a task 13 built WITHOUT part а) fails has-both-parts — matches FIPI fact 3 (no answer to а → 0 points)', () => {
    const { templateRegistry, validationRegistry } = makeRegistries();
    const fullSolution = buildCanonicalSolutionForTask13Variant1(realTask13Fields);
    const missingPartA = { ...fullSolution, parts: fullSolution.parts.filter((p) => p.id !== 'a') };

    const result = runCanonicalSolutionPipeline(task, missingPartA, {
      templateRegistry,
      validationRegistry,
    });

    expect(result.status).toBe('validation_failed');
    const partsResult = result.validationResults.find((r) => r.ruleId === 'has-both-parts');
    expect(partsResult?.passed).toBe(false);
  });
});
