import { describe, expect, it } from 'vitest';
import {
  SolutionTemplateRegistry,
  ValidationRuleRegistry,
  registerGenericValidators,
  runCanonicalSolutionPipeline,
  type TaskTypeContext,
} from '../../../solutionEngine/index.js';
import { mathTask16EconomicsTemplate, registerMathTask16Templates } from './economics.v1.js';
import { buildCanonicalSolutionForTask16Variant1 } from './realTask16Variant1.js';

// Real field values, copied verbatim from
// packages/db/src/importEge2026Variant1.ts (taskNumber: 16) — not
// invented for this test. A stable test UUID stands in for the real
// DB-generated id, which doesn't exist until the row is inserted.
const REAL_TASK_16_ID = '00000000-0000-0000-0000-000000000016';
const realTask16Fields = {
  taskId: REAL_TASK_16_ID,
  correctAnswer: '5',
  correctAnswerDisplay: null,
};

function makeRegistries() {
  const templateRegistry = new SolutionTemplateRegistry();
  registerMathTask16Templates(templateRegistry);
  const validationRegistry = new ValidationRuleRegistry();
  registerGenericValidators(validationRegistry);
  return { templateRegistry, validationRegistry };
}

describe('real task 16 — independent mathematical re-derivation', () => {
  // This does NOT trust explanationMd — it re-derives the total-payments
  // formula from scratch (variable A, 0.6A over the interest-only years,
  // P = 36A/55 for the two equal payments, total = 21A/11), then confirms
  // the task's own correctAnswer ('5') is the largest integer A
  // satisfying the ≤10 million constraint.
  it('total payments as a function of A is 21A/11', () => {
    const totalPayments = (a: number) => {
      const interestOnlyYears = 3 * 0.2 * a; // 0.6A
      const p = (1.2 * a * 1.2) / 2.2; // P = 1.44A / 2.2 = 36A/55
      return interestOnlyYears + 2 * p;
    };
    for (const a of [1, 5, 11, 55]) {
      expect(totalPayments(a)).toBeCloseTo((21 * a) / 11, 10);
    }
  });

  it('A=5 satisfies the ≤10 million constraint, A=6 does not — matching correctAnswer exactly', () => {
    const totalPayments = (a: number) => (21 * a) / 11;
    expect(totalPayments(5)).toBeLessThanOrEqual(10);
    expect(totalPayments(6)).toBeGreaterThan(10);
  });

  it('the boundary 110/21 is between 5 and 6, confirming 5 is the largest integer solution', () => {
    const boundary = 110 / 21;
    expect(boundary).toBeGreaterThan(5);
    expect(boundary).toBeLessThan(6);
  });
});

describe('real task 16 — full pipeline', () => {
  const task: TaskTypeContext = { id: REAL_TASK_16_ID, subjectId: 'math', taskNumber: 16 };

  it('(A) resolves to the math:16 economics template', () => {
    const { templateRegistry } = makeRegistries();
    expect(templateRegistry.resolve('math:16')).toBe(mathTask16EconomicsTemplate);
  });

  it('(B) builds a CanonicalSolution with exactly one part (main) — no invented а)/б) split', () => {
    const solution = buildCanonicalSolutionForTask16Variant1(realTask16Fields);
    expect(solution.parts.map((p) => p.id)).toEqual(['main']);
  });

  it('(C) the single part has the real correctAnswer and real canonical steps', () => {
    const solution = buildCanonicalSolutionForTask16Variant1(realTask16Fields);
    const part = solution.parts[0]!;

    expect(part.hasCheckableAnswer).toBe(true);
    expect(part.answer).toBe(realTask16Fields.correctAnswer);

    expect(part.steps.map((s) => s.title)).toEqual([
      'Вводим обозначение',
      'Считаем выплаты за 2029–2031 годы',
      'Составляем уравнение для равного платежа P',
      'Находим общую сумму выплат',
      'Решаем неравенство и находим наибольшее целое A',
    ]);
    // The model-setup step is actually tagged — this is what `has-model-setup-step` checks.
    expect(part.steps.find((s) => s.id === 's1')?.kind).toBe('model_setup');
  });

  it('(D) template id/version are recorded on the built CanonicalSolution', () => {
    const solution = buildCanonicalSolutionForTask16Variant1(realTask16Fields);
    expect(solution.templateId).toBe(mathTask16EconomicsTemplate.id);
    expect(solution.templateVersion).toBe(mathTask16EconomicsTemplate.version);
  });

  it('(E) the full pipeline resolves the template, builds the solution, and validation passes', () => {
    const { templateRegistry, validationRegistry } = makeRegistries();
    const canonicalSolution = buildCanonicalSolutionForTask16Variant1(realTask16Fields);

    const result = runCanonicalSolutionPipeline(task, canonicalSolution, {
      templateRegistry,
      validationRegistry,
    });

    expect(result.status).toBe('validated');
    expect(result.template).toBe(mathTask16EconomicsTemplate);
    expect(result.canonicalSolution).toBe(canonicalSolution);
    expect(result.validationResults.every((r) => r.passed)).toBe(true);
    expect(result.validationResults.map((r) => r.ruleId).sort()).toEqual(
      ['has-content', 'has-model-setup-step'].sort(),
    );
  });

  it('a task 16 built WITHOUT the model-setup step fails has-model-setup-step', () => {
    const { templateRegistry, validationRegistry } = makeRegistries();
    const fullSolution = buildCanonicalSolutionForTask16Variant1(realTask16Fields);
    const withoutModelSetupStep = {
      ...fullSolution,
      parts: fullSolution.parts.map((part) => ({
        ...part,
        steps: part.steps.filter((s) => s.kind !== 'model_setup'),
      })),
    };

    const result = runCanonicalSolutionPipeline(task, withoutModelSetupStep, {
      templateRegistry,
      validationRegistry,
    });

    expect(result.status).toBe('validation_failed');
    const modelSetupResult = result.validationResults.find(
      (r) => r.ruleId === 'has-model-setup-step',
    );
    expect(modelSetupResult?.passed).toBe(false);
  });
});

describe('real task 16 — critical points', () => {
  it('(A) contains the expected critical points, each with a source', () => {
    const solution = buildCanonicalSolutionForTask16Variant1(realTask16Fields);
    const ids = solution.criticalPoints?.map((p) => p.id).sort();

    expect(ids).toEqual(
      [
        'variables-must-be-defined-and-justified',
        'model-must-be-fully-solved-and-justified',
        'integer-constraint-must-be-applied',
        'debt-returns-to-principal-each-interest-only-year',
      ].sort(),
    );
  });

  it('(B) rubric-derived points are tagged secondary_source_verified, never fipi_verified', () => {
    const solution = buildCanonicalSolutionForTask16Variant1(realTask16Fields);
    const bySource = (
      source: 'fipi_verified' | 'secondary_source_verified' | 'project_quality_rule',
    ) => solution.criticalPoints!.filter((p) => p.source === source).map((p) => p.id);

    expect(bySource('fipi_verified')).toEqual([]);
    expect(bySource('secondary_source_verified').sort()).toEqual(
      [
        'variables-must-be-defined-and-justified',
        'model-must-be-fully-solved-and-justified',
      ].sort(),
    );
    expect(bySource('project_quality_rule').sort()).toEqual(
      [
        'integer-constraint-must-be-applied',
        'debt-returns-to-principal-each-interest-only-year',
      ].sort(),
    );
  });

  it('(C) all points are linked to the single "main" part', () => {
    const solution = buildCanonicalSolutionForTask16Variant1(realTask16Fields);
    for (const point of solution.criticalPoints!) {
      expect(point.partId).toBe('main');
    }
  });

  it('(D) the required structural point (has-model-setup-step) is satisfied when the model-setup step is present', () => {
    const { templateRegistry, validationRegistry } = makeRegistries();
    const solution = buildCanonicalSolutionForTask16Variant1(realTask16Fields);
    const task: TaskTypeContext = { id: REAL_TASK_16_ID, subjectId: 'math', taskNumber: 16 };

    const result = runCanonicalSolutionPipeline(task, solution, {
      templateRegistry,
      validationRegistry,
    });

    const check = result.criticalPointChecks.find(
      (c) => c.criticalPointId === 'variables-must-be-defined-and-justified',
    );
    expect(check?.status).toBe('satisfied');

    const contentCheck = result.criticalPointChecks.find(
      (c) => c.criticalPointId === 'model-must-be-fully-solved-and-justified',
    );
    expect(contentCheck?.status).toBe('satisfied');
  });

  it('(E) the purely mathematical correctness points stay unlinked — no structural validator can verify them', () => {
    const { templateRegistry, validationRegistry } = makeRegistries();
    const solution = buildCanonicalSolutionForTask16Variant1(realTask16Fields);
    const task: TaskTypeContext = { id: REAL_TASK_16_ID, subjectId: 'math', taskNumber: 16 };

    const result = runCanonicalSolutionPipeline(task, solution, {
      templateRegistry,
      validationRegistry,
    });

    for (const id of [
      'integer-constraint-must-be-applied',
      'debt-returns-to-principal-each-interest-only-year',
    ]) {
      const check = result.criticalPointChecks.find((c) => c.criticalPointId === id);
      expect(check?.status).toBe('unlinked');
    }
    expect(result.status).toBe('validated');
  });
});

describe('real task 16 — exam writeup (new, stricter completeness standard)', () => {
  it('(A) has a non-empty examWriteup', () => {
    const solution = buildCanonicalSolutionForTask16Variant1(realTask16Fields);
    expect(solution.examWriteup?.content).toBeTruthy();
  });

  it('(B) explicitly introduces the variable A', () => {
    const solution = buildCanonicalSolutionForTask16Variant1(realTask16Fields);
    expect(solution.examWriteup?.content).toContain('$A$');
  });

  it('(C) ends with the final answer, matching correctAnswer (no display form for this task)', () => {
    const solution = buildCanonicalSolutionForTask16Variant1(realTask16Fields);
    const content = solution.examWriteup?.content ?? '';
    expect(content.trim().endsWith(`Ответ: ${realTask16Fields.correctAnswer}`)).toBe(true);
  });

  it('(D) is compact — shorter than the detailed steps, and never duplicates the task condition', () => {
    const solution = buildCanonicalSolutionForTask16Variant1(realTask16Fields);
    const content = solution.examWriteup?.content ?? '';
    const detailedStepsLength = solution.parts
      .flatMap((part) => part.steps)
      .reduce((sum, step) => sum + step.explanation.length, 0);
    expect(content.length).toBeLessThan(detailedStepsLength);
    expect(content).not.toContain('Петя взял кредит');
  });

  it('(E) independent steps are on separate lines, never glued with a mechanical ":" continuation', () => {
    const solution = buildCanonicalSolutionForTask16Variant1(realTask16Fields);
    const content = solution.examWriteup?.content ?? '';
    for (const line of content.split('\n')) {
      expect(line.trimEnd().endsWith(':')).toBe(false);
    }
  });

  // The user's explicit new quality bar for tasks 16-19: the examWriteup
  // must contain every key intermediate result, not just the final
  // answer — "если ученик перепишет только этот блок на экзамене,
  // сможет ли эксперт увидеть полный ход решения". These checks assert
  // presence of each load-bearing intermediate quantity.
  it('(F) contains every mathematically load-bearing intermediate result, not just the final answer', () => {
    const solution = buildCanonicalSolutionForTask16Variant1(realTask16Fields);
    const content = solution.examWriteup?.content ?? '';

    expect(content).toContain('0.6A'); // total of the three interest-only payments
    expect(content).toContain('36A}{55}'); // P, the equal-payment formula
    expect(content).toContain('21A}{11}'); // total payments as a function of A
    expect(content).toContain('110}{21}'); // the boundary value before integer rounding
    expect(content).toContain('A=5'); // the explicit integer conclusion, not left as a fraction
  });

  it('(G) justifies the model (explains why the equation/inequality holds), not just states it', () => {
    const solution = buildCanonicalSolutionForTask16Variant1(realTask16Fields);
    const content = solution.examWriteup?.content ?? '';
    // The debt-returns-to-A-each-year fact and the "second payment pays
    // off the debt" fact are both explicit textual justifications, not
    // just bare formulas.
    expect(content).toContain('Выплачиваются только проценты');
    expect(content).toContain('полностью гасит долг');
  });

  it('(H) explicitly applies the integer constraint rather than leaving the answer as a fraction', () => {
    const solution = buildCanonicalSolutionForTask16Variant1(realTask16Fields);
    const content = solution.examWriteup?.content ?? '';
    expect(content).toContain('целое число');
  });
});
