import { describe, expect, it } from 'vitest';
import {
  SolutionTemplateRegistry,
  ValidationRuleRegistry,
  registerGenericValidators,
  runCanonicalSolutionPipeline,
  type TaskTypeContext,
} from '../../../solutionEngine/index.js';
import { mathTask15InequalityTemplate, registerMathTask15Templates } from './inequality.v1.js';
import { buildCanonicalSolutionForTask15Variant1 } from './realTask15Variant1.js';
import { checkIntervalAnswer, parseIntervalSet } from '../../../intervalAnswer.js';

// Real field values, copied verbatim from
// packages/db/src/importEge2026Variant1.ts (taskNumber: 15) — not
// invented for this test. A stable test UUID stands in for the real
// DB-generated id, which doesn't exist until the row is inserted.
const REAL_TASK_15_ID = '00000000-0000-0000-0000-000000000015';
const realTask15Fields = {
  taskId: REAL_TASK_15_ID,
  correctAnswer: '(log_5(2);log_5(8)) ∪ (log_5(8);log_3(8)]',
  correctAnswerDisplay: '$(\\log_5 2;\\ \\log_5 8) \\cup (\\log_5 8;\\ \\log_3 8]$',
};

function makeRegistries() {
  const templateRegistry = new SolutionTemplateRegistry();
  registerMathTask15Templates(templateRegistry);
  const validationRegistry = new ValidationRuleRegistry();
  registerGenericValidators(validationRegistry);
  return { templateRegistry, validationRegistry };
}

describe('real task 15 — independent mathematical re-derivation', () => {
  // This does NOT trust explanationMd — it re-derives the boundary
  // values from scratch via the actual log definitions, then confirms
  // the task's own correctAnswer matches, using the same numeric
  // parser the real answer checker uses (intervalAnswer.ts).
  it('log_5(2) < log_5(8) < log_3(8) — the excluded point genuinely lies inside the candidate interval', () => {
    const log5_2 = Math.log(2) / Math.log(5);
    const log5_8 = Math.log(8) / Math.log(5);
    const log3_8 = Math.log(8) / Math.log(3);
    expect(log5_2).toBeLessThan(log5_8);
    expect(log5_8).toBeLessThan(log3_8);
  });

  it("the task's own correctAnswer parses to exactly the independently re-derived interval set", () => {
    const parsed = parseIntervalSet(realTask15Fields.correctAnswer);
    expect(parsed).not.toBeNull();
    const log5_2 = Math.log(2) / Math.log(5);
    const log5_8 = Math.log(8) / Math.log(5);
    const log3_8 = Math.log(8) / Math.log(3);
    expect(parsed).toEqual([
      { left: log5_2, leftClosed: false, right: log5_8, rightClosed: false },
      { left: log5_8, leftClosed: false, right: log3_8, rightClosed: true },
    ]);
  });

  it('the existing answer checker accepts the correct answer and rejects an answer that wrongly merges across the excluded point', () => {
    expect(
      checkIntervalAnswer(realTask15Fields.correctAnswer, realTask15Fields.correctAnswer),
    ).toBe(true);
    // A plausible student mistake: forgetting the excluded point entirely.
    expect(checkIntervalAnswer('(log_5(2);log_3(8)]', realTask15Fields.correctAnswer)).toBe(false);
  });
});

describe('real task 15 — full pipeline', () => {
  const task: TaskTypeContext = { id: REAL_TASK_15_ID, subjectId: 'math', taskNumber: 15 };

  it('(A) resolves to the math:15 inequality template', () => {
    const { templateRegistry } = makeRegistries();
    expect(templateRegistry.resolve('math:15')).toBe(mathTask15InequalityTemplate);
  });

  it('(B) builds a CanonicalSolution with exactly one part (main) — no invented а)/б) split', () => {
    const solution = buildCanonicalSolutionForTask15Variant1(realTask15Fields);
    expect(solution.parts.map((p) => p.id)).toEqual(['main']);
  });

  it('(C) the single part has the real correctAnswer and real canonical steps', () => {
    const solution = buildCanonicalSolutionForTask15Variant1(realTask15Fields);
    const part = solution.parts[0]!;

    expect(part.hasCheckableAnswer).toBe(true);
    expect(part.answer).toBe(realTask15Fields.correctAnswer);
    expect(part.answerDisplay).toBe(realTask15Fields.correctAnswerDisplay);

    expect(part.steps.map((s) => s.title)).toEqual([
      'Находим ОДЗ',
      'Упрощаем знаменатель',
      'Находим исключённую точку',
      'Сводим неравенство к числителю',
      'Решаем неравенство для числителя',
      'Пересекаем с ОДЗ и исключаем точку',
    ]);
    // The domain step is actually tagged — this is what `has-domain-step` checks.
    expect(part.steps.find((s) => s.id === 's1')?.kind).toBe('domain_check');
  });

  it('(D) template id/version are recorded on the built CanonicalSolution', () => {
    const solution = buildCanonicalSolutionForTask15Variant1(realTask15Fields);
    expect(solution.templateId).toBe(mathTask15InequalityTemplate.id);
    expect(solution.templateVersion).toBe(mathTask15InequalityTemplate.version);
  });

  it('(E) the full pipeline resolves the template, builds the solution, and validation passes', () => {
    const { templateRegistry, validationRegistry } = makeRegistries();
    const canonicalSolution = buildCanonicalSolutionForTask15Variant1(realTask15Fields);

    const result = runCanonicalSolutionPipeline(task, canonicalSolution, {
      templateRegistry,
      validationRegistry,
    });

    expect(result.status).toBe('validated');
    expect(result.template).toBe(mathTask15InequalityTemplate);
    expect(result.canonicalSolution).toBe(canonicalSolution);
    expect(result.validationResults.every((r) => r.passed)).toBe(true);
    expect(result.validationResults.map((r) => r.ruleId).sort()).toEqual(
      ['has-content', 'has-domain-step'].sort(),
    );
  });

  it('a task 15 built WITHOUT the domain-check step fails has-domain-step', () => {
    const { templateRegistry, validationRegistry } = makeRegistries();
    const fullSolution = buildCanonicalSolutionForTask15Variant1(realTask15Fields);
    const withoutDomainStep = {
      ...fullSolution,
      parts: fullSolution.parts.map((part) => ({
        ...part,
        steps: part.steps.filter((s) => s.kind !== 'domain_check'),
      })),
    };

    const result = runCanonicalSolutionPipeline(task, withoutDomainStep, {
      templateRegistry,
      validationRegistry,
    });

    expect(result.status).toBe('validation_failed');
    const domainResult = result.validationResults.find((r) => r.ruleId === 'has-domain-step');
    expect(domainResult?.passed).toBe(false);
  });
});

describe('real task 15 — critical points', () => {
  it('(A) contains the expected critical points, each with a source', () => {
    const solution = buildCanonicalSolutionForTask15Variant1(realTask15Fields);
    const ids = solution.criticalPoints?.map((p) => p.id).sort();

    expect(ids).toEqual(
      [
        'excluded-point-must-not-be-in-answer',
        'boundary-strictness-matters',
        'full-justification-required',
        'domain-must-be-stated',
        'denominator-is-a-perfect-square',
      ].sort(),
    );
  });

  it('(B) rubric-derived points are tagged secondary_source_verified, never fipi_verified', () => {
    const solution = buildCanonicalSolutionForTask15Variant1(realTask15Fields);
    const bySource = (
      source: 'fipi_verified' | 'secondary_source_verified' | 'project_quality_rule',
    ) => solution.criticalPoints!.filter((p) => p.source === source).map((p) => p.id);

    expect(bySource('fipi_verified')).toEqual([]);
    expect(bySource('secondary_source_verified').sort()).toEqual(
      [
        'excluded-point-must-not-be-in-answer',
        'boundary-strictness-matters',
        'full-justification-required',
      ].sort(),
    );
    expect(bySource('project_quality_rule').sort()).toEqual(
      ['domain-must-be-stated', 'denominator-is-a-perfect-square'].sort(),
    );
  });

  it('(C) all points are linked to the single "main" part', () => {
    const solution = buildCanonicalSolutionForTask15Variant1(realTask15Fields);
    for (const point of solution.criticalPoints!) {
      expect(point.partId).toBe('main');
    }
  });

  it('(D) a required structural point (has-domain-step) is satisfied when the domain step is present', () => {
    const { templateRegistry, validationRegistry } = makeRegistries();
    const solution = buildCanonicalSolutionForTask15Variant1(realTask15Fields);
    const task: TaskTypeContext = { id: REAL_TASK_15_ID, subjectId: 'math', taskNumber: 15 };

    const result = runCanonicalSolutionPipeline(task, solution, {
      templateRegistry,
      validationRegistry,
    });

    const check = result.criticalPointChecks.find(
      (c) => c.criticalPointId === 'excluded-point-must-not-be-in-answer',
    );
    expect(check?.status).toBe('satisfied');

    const domainCheck = result.criticalPointChecks.find(
      (c) => c.criticalPointId === 'domain-must-be-stated',
    );
    expect(domainCheck?.status).toBe('satisfied');
  });

  it('(E) the perfect-square correctness point stays unlinked — a structural validator cannot verify an algebraic identity', () => {
    const { templateRegistry, validationRegistry } = makeRegistries();
    const solution = buildCanonicalSolutionForTask15Variant1(realTask15Fields);
    const task: TaskTypeContext = { id: REAL_TASK_15_ID, subjectId: 'math', taskNumber: 15 };

    const result = runCanonicalSolutionPipeline(task, solution, {
      templateRegistry,
      validationRegistry,
    });

    const check = result.criticalPointChecks.find(
      (c) => c.criticalPointId === 'denominator-is-a-perfect-square',
    );
    expect(check?.status).toBe('unlinked');
    expect(result.status).toBe('validated');
  });
});

describe('real task 15 — exam writeup', () => {
  it('(A) has a compact examWriteup', () => {
    const solution = buildCanonicalSolutionForTask15Variant1(realTask15Fields);
    expect(solution.examWriteup?.content).toBeTruthy();
  });

  it('(B) states the domain (ОДЗ) explicitly', () => {
    const solution = buildCanonicalSolutionForTask15Variant1(realTask15Fields);
    expect(solution.examWriteup?.content).toContain('ОДЗ');
  });

  it('(C) ends with the final answer, matching correctAnswerDisplay', () => {
    const solution = buildCanonicalSolutionForTask15Variant1(realTask15Fields);
    const content = solution.examWriteup?.content ?? '';
    expect(content.trim().endsWith(`Ответ: ${realTask15Fields.correctAnswerDisplay}`)).toBe(true);
  });

  it('(D) is compact — shorter than the detailed steps, and never duplicates the task condition', () => {
    const solution = buildCanonicalSolutionForTask15Variant1(realTask15Fields);
    const content = solution.examWriteup?.content ?? '';
    const detailedStepsLength = solution.parts
      .flatMap((part) => part.steps)
      .reduce((sum, step) => sum + step.explanation.length, 0);
    expect(content.length).toBeLessThan(detailedStepsLength);
    expect(content).not.toContain('Решите неравенство');
  });

  it('(E) independent equations/steps are on separate lines, not glued into one formula', () => {
    const solution = buildCanonicalSolutionForTask15Variant1(realTask15Fields);
    const content = solution.examWriteup?.content ?? '';
    expect(content).not.toMatch(/\\leqslant[^$]*\\Rightarrow[^$]*\\Rightarrow/);
  });

  it('(F) no mechanical trailing ":" right before the next line continues', () => {
    const solution = buildCanonicalSolutionForTask15Variant1(realTask15Fields);
    const content = solution.examWriteup?.content ?? '';
    for (const line of content.split('\n')) {
      expect(line.trimEnd().endsWith(':')).toBe(false);
    }
  });

  it('(G) mentions the excluded point explicitly, not just the final interval', () => {
    const solution = buildCanonicalSolutionForTask15Variant1(realTask15Fields);
    const content = solution.examWriteup?.content ?? '';
    expect(content).toContain('исключ');
  });
});
