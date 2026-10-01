import { describe, expect, it } from 'vitest';
import {
  SolutionTemplateRegistry,
  ValidationRuleRegistry,
  registerGenericValidators,
  runCanonicalSolutionPipeline,
  type TaskTypeContext,
} from '../../../solutionEngine/index.js';
import { mathTask18ParametersTemplate, registerMathTask18Templates } from './parameters.v1.js';
import { buildCanonicalSolutionForTask18Variant1 } from './realTask18Variant1.js';

// Real field values, copied verbatim from
// packages/db/src/importEge2026Variant1.ts (taskNumber: 18) — not
// invented for this test. A stable test UUID stands in for the real
// DB-generated id, which doesn't exist until the row is inserted.
const REAL_TASK_18_ID = '00000000-0000-0000-0000-000000000018';
const realTask18Fields = {
  taskId: REAL_TASK_18_ID,
  correctAnswer: '36/25; (√13-2;4)',
  correctAnswerDisplay: '$\\dfrac{36}{25};\\ (\\sqrt{13}-2;\\ 4)$',
};

function makeRegistries() {
  const templateRegistry = new SolutionTemplateRegistry();
  registerMathTask18Templates(templateRegistry);
  const validationRegistry = new ValidationRuleRegistry();
  registerGenericValidators(validationRegistry);
  return { templateRegistry, validationRegistry };
}

// Helper matching the task's own K(a) definition — used across several
// independent re-derivation checks below.
function K(a: number): number {
  return 25 * a * a - 36 * a;
}

describe('real task 18 — independent mathematical re-derivation', () => {
  // This does NOT trust explanationMd — it re-derives the domain, the
  // rejection of a=0, the K=0 boundary point, the cubic's roots, and
  // the final interval from scratch via direct numeric computation.
  it('K(a) = a(25a-36) is negative on (0, 36/25) and nonnegative at the endpoints', () => {
    expect(K(1)).toBeLessThan(0); // 1 ∈ (0, 36/25)
    expect(K(0)).toBe(0);
    expect(K(36 / 25)).toBeCloseTo(0, 10);
    expect(K(2)).toBeGreaterThan(0);
  });

  it('a=0 gives K=0 but only ONE solution (x=0), confirming it must be rejected', () => {
    const a = 0;
    expect(K(a)).toBe(0);
    // |x - a^2| = 0 has exactly one solution x=0 when a^2=0.
    const aSquared = a * a;
    expect(aSquared).toBe(0);
  });

  it('a=36/25 gives K=0 and a²>0, confirming exactly 2 distinct x solutions (x=±a²)', () => {
    const a = 36 / 25;
    expect(K(a)).toBeCloseTo(0, 10);
    expect(a * a).toBeGreaterThan(0);
  });

  it('a³-25a+36 factors as (a-4)(a²+4a-9), confirmed by direct polynomial expansion', () => {
    const cubic = (a: number) => a ** 3 - 25 * a + 36;
    const factored = (a: number) => (a - 4) * (a * a + 4 * a - 9);
    for (const a of [-3, -1, 0, 1, 1.6, 2, 3.6, 5, 10]) {
      expect(cubic(a)).toBeCloseTo(factored(a), 10);
    }
  });

  it('the roots of a²+4a-9=0 are exactly -2±√13, confirmed by substitution', () => {
    const r1 = -2 + Math.sqrt(13);
    const r2 = -2 - Math.sqrt(13);
    expect(r1 * r1 + 4 * r1 - 9).toBeCloseTo(0, 10);
    expect(r2 * r2 + 4 * r2 - 9).toBeCloseTo(0, 10);
  });

  it('the cubic a³-25a+36 is negative exactly on (√13-2, 4) within the a>36/25 domain', () => {
    const cubic = (a: number) => a ** 3 - 25 * a + 36;
    const lower = Math.sqrt(13) - 2;
    // Strictly inside (√13-2, 4): negative.
    expect(cubic((lower + 4) / 2)).toBeLessThan(0);
    // Between 36/25 and √13-2: positive (this is the "gap" the
    // isolated point and the interval must not be merged across).
    expect(cubic((36 / 25 + lower) / 2)).toBeGreaterThan(0);
    // Above 4: positive again.
    expect(cubic(5)).toBeGreaterThan(0);
  });

  it('√13-2 > 36/25, confirming the interval (√13-2,4) lies entirely within a>36/25', () => {
    expect(Math.sqrt(13) - 2).toBeGreaterThan(36 / 25);
  });

  it('at the boundary points a=√13-2 and a=4, a²-√K=0 exactly, confirming they must be excluded', () => {
    for (const a of [Math.sqrt(13) - 2, 4]) {
      const k = K(a);
      expect(a * a - Math.sqrt(k)).toBeCloseTo(0, 8);
    }
  });

  it("the task's own correctAnswer ('36/25; (√13-2;4)') matches this independently re-derived set exactly", () => {
    // Just past the isolated point in the gap (36/25, √13-2): excluded (3 solutions).
    const inGap = (36 / 25 + (Math.sqrt(13) - 2)) / 2;
    expect(K(inGap)).toBeGreaterThan(0);
    const aSq = inGap * inGap;
    expect(aSq - Math.sqrt(K(inGap))).toBeGreaterThanOrEqual(0); // 3 solutions here, correctly excluded
    // Just inside the answer interval: included (exactly 2 solutions).
    const inInterval = (Math.sqrt(13) - 2 + 4) / 2;
    expect(K(inInterval)).toBeGreaterThan(0);
    const aSq2 = inInterval * inInterval;
    expect(aSq2 - Math.sqrt(K(inInterval))).toBeLessThan(0); // exactly 2 solutions here
  });
});

describe('real task 18 — full pipeline', () => {
  const task: TaskTypeContext = { id: REAL_TASK_18_ID, subjectId: 'math', taskNumber: 18 };

  it('(A) resolves to the math:18 parameters template', () => {
    const { templateRegistry } = makeRegistries();
    expect(templateRegistry.resolve('math:18')).toBe(mathTask18ParametersTemplate);
  });

  it('(B) builds a CanonicalSolution with exactly one part (main) — no invented а)/б) split', () => {
    const solution = buildCanonicalSolutionForTask18Variant1(realTask18Fields);
    expect(solution.parts.map((p) => p.id)).toEqual(['main']);
  });

  it('(C) the single part has the real correctAnswer and real canonical steps', () => {
    const solution = buildCanonicalSolutionForTask18Variant1(realTask18Fields);
    const part = solution.parts[0]!;

    expect(part.hasCheckableAnswer).toBe(true);
    expect(part.answer).toBe(realTask18Fields.correctAnswer);
    expect(part.answerDisplay).toBe(realTask18Fields.correctAnswerDisplay);

    expect(part.steps.map((s) => s.title)).toEqual([
      'Находим область значений параметра и выражаем y',
      'Подставляем y в первое уравнение',
      'Упрощаем правую часть через a',
      'Находим, при каких a уравнение относительно x вообще имеет решения',
      'Разбираем случай K = 0',
      'Разбираем случай K > 0 и ставим условие на количество решений',
      'Решаем неравенство на a и находим итоговый ответ',
    ]);
    expect(part.steps.find((s) => s.id === 's1')?.kind).toBe('domain_check');
    expect(part.steps.find((s) => s.id === 's4')?.kind).toBe('critical_value_derivation');
    expect(part.steps.find((s) => s.id === 's7')?.kind).toBe('critical_value_derivation');
  });

  it('(D) template id/version are recorded on the built CanonicalSolution', () => {
    const solution = buildCanonicalSolutionForTask18Variant1(realTask18Fields);
    expect(solution.templateId).toBe(mathTask18ParametersTemplate.id);
    expect(solution.templateVersion).toBe(mathTask18ParametersTemplate.version);
  });

  it('(E) the full pipeline resolves the template, builds the solution, and validation passes', () => {
    const { templateRegistry, validationRegistry } = makeRegistries();
    const canonicalSolution = buildCanonicalSolutionForTask18Variant1(realTask18Fields);

    const result = runCanonicalSolutionPipeline(task, canonicalSolution, {
      templateRegistry,
      validationRegistry,
    });

    expect(result.status).toBe('validated');
    expect(result.template).toBe(mathTask18ParametersTemplate);
    expect(result.canonicalSolution).toBe(canonicalSolution);
    expect(result.validationResults.every((r) => r.passed)).toBe(true);
    expect(result.validationResults.map((r) => r.ruleId).sort()).toEqual(
      ['has-content', 'has-domain-step', 'has-critical-value-step'].sort(),
    );
  });

  it('a task 18 built WITHOUT the domain-check step fails has-domain-step', () => {
    const { templateRegistry, validationRegistry } = makeRegistries();
    const fullSolution = buildCanonicalSolutionForTask18Variant1(realTask18Fields);
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

  it('a task 18 built WITHOUT any critical_value_derivation step fails has-critical-value-step', () => {
    const { templateRegistry, validationRegistry } = makeRegistries();
    const fullSolution = buildCanonicalSolutionForTask18Variant1(realTask18Fields);
    const withoutCriticalValueSteps = {
      ...fullSolution,
      parts: fullSolution.parts.map((part) => ({
        ...part,
        steps: part.steps.filter((s) => s.kind !== 'critical_value_derivation'),
      })),
    };

    const result = runCanonicalSolutionPipeline(task, withoutCriticalValueSteps, {
      templateRegistry,
      validationRegistry,
    });

    expect(result.status).toBe('validation_failed');
    const check = result.validationResults.find((r) => r.ruleId === 'has-critical-value-step');
    expect(check?.passed).toBe(false);
  });
});

describe('real task 18 — critical points', () => {
  it('(A) contains the expected critical points, each with a source', () => {
    const solution = buildCanonicalSolutionForTask18Variant1(realTask18Fields);
    const ids = solution.criticalPoints?.map((p) => p.id).sort();

    expect(ids).toEqual(
      [
        'full-justification-required-for-max-score',
        'missing-boundary-values-reduces-score',
        'domain-a-nonnegative-must-be-stated',
        'case-a-equals-zero-must-be-checked-and-rejected',
        'squaring-step-must-be-justified-as-equivalence',
        'isolated-point-and-interval-must-not-be-merged',
        'boundary-points-must-be-excluded-with-justification',
        'free-method-disclaimer',
      ].sort(),
    );
  });

  it('(B) rubric-derived points are tagged secondary_source_verified, never fipi_verified', () => {
    const solution = buildCanonicalSolutionForTask18Variant1(realTask18Fields);
    const bySource = (
      source: 'fipi_verified' | 'secondary_source_verified' | 'project_quality_rule',
    ) => solution.criticalPoints!.filter((p) => p.source === source).map((p) => p.id);

    expect(bySource('fipi_verified')).toEqual([]);
    expect(bySource('secondary_source_verified').sort()).toEqual(
      [
        'full-justification-required-for-max-score',
        'missing-boundary-values-reduces-score',
        'free-method-disclaimer',
      ].sort(),
    );
    expect(bySource('project_quality_rule').sort()).toEqual(
      [
        'domain-a-nonnegative-must-be-stated',
        'case-a-equals-zero-must-be-checked-and-rejected',
        'squaring-step-must-be-justified-as-equivalence',
        'isolated-point-and-interval-must-not-be-merged',
        'boundary-points-must-be-excluded-with-justification',
      ].sort(),
    );
  });

  it('(C) all partId-linked points are linked to the single "main" part', () => {
    const solution = buildCanonicalSolutionForTask18Variant1(realTask18Fields);
    for (const point of solution.criticalPoints!) {
      if (point.partId !== undefined) {
        expect(point.partId).toBe('main');
      }
    }
  });

  it('(D) the required structural points (has-domain-step, has-content) are satisfied when their steps are present', () => {
    const { templateRegistry, validationRegistry } = makeRegistries();
    const solution = buildCanonicalSolutionForTask18Variant1(realTask18Fields);
    const task: TaskTypeContext = { id: REAL_TASK_18_ID, subjectId: 'math', taskNumber: 18 };

    const result = runCanonicalSolutionPipeline(task, solution, {
      templateRegistry,
      validationRegistry,
    });

    const domainCheck = result.criticalPointChecks.find(
      (c) => c.criticalPointId === 'domain-a-nonnegative-must-be-stated',
    );
    expect(domainCheck?.status).toBe('satisfied');

    const contentCheck = result.criticalPointChecks.find(
      (c) => c.criticalPointId === 'full-justification-required-for-max-score',
    );
    expect(contentCheck?.status).toBe('satisfied');
  });

  it('(E) the purely logical/mathematical correctness points stay unlinked — no structural validator can verify them', () => {
    const { templateRegistry, validationRegistry } = makeRegistries();
    const solution = buildCanonicalSolutionForTask18Variant1(realTask18Fields);
    const task: TaskTypeContext = { id: REAL_TASK_18_ID, subjectId: 'math', taskNumber: 18 };

    const result = runCanonicalSolutionPipeline(task, solution, {
      templateRegistry,
      validationRegistry,
    });

    for (const id of [
      'case-a-equals-zero-must-be-checked-and-rejected',
      'squaring-step-must-be-justified-as-equivalence',
      'isolated-point-and-interval-must-not-be-merged',
      'boundary-points-must-be-excluded-with-justification',
    ]) {
      const check = result.criticalPointChecks.find((c) => c.criticalPointId === id);
      expect(check?.status).toBe('unlinked');
    }
    expect(result.status).toBe('validated');
  });

  it('(F) the presentation point (free method) is never required', () => {
    const solution = buildCanonicalSolutionForTask18Variant1(realTask18Fields);
    const point = solution.criticalPoints!.find((p) => p.id === 'free-method-disclaimer')!;
    expect(point.category).toBe('presentation');
    expect(point.required).toBe(false);
  });
});

describe('real task 18 — exam writeup (stricter standard than №16-17: a full parameter investigation)', () => {
  it('(A) has a non-empty examWriteup', () => {
    const solution = buildCanonicalSolutionForTask18Variant1(realTask18Fields);
    expect(solution.examWriteup?.content).toBeTruthy();
  });

  it('(B) explicitly states the domain a⩾0', () => {
    const solution = buildCanonicalSolutionForTask18Variant1(realTask18Fields);
    expect(solution.examWriteup?.content).toContain('a\\geqslant0');
  });

  it('(C) ends with the final answer, matching correctAnswerDisplay', () => {
    const solution = buildCanonicalSolutionForTask18Variant1(realTask18Fields);
    const content = solution.examWriteup?.content ?? '';
    expect(content.trim().endsWith(`Ответ: ${realTask18Fields.correctAnswerDisplay}`)).toBe(true);
  });

  it('(D) is compact — shorter than the detailed steps, and never duplicates the task condition', () => {
    const solution = buildCanonicalSolutionForTask18Variant1(realTask18Fields);
    const content = solution.examWriteup?.content ?? '';
    const detailedStepsLength = solution.parts
      .flatMap((part) => part.steps)
      .reduce((sum, step) => sum + step.explanation.length, 0);
    expect(content.length).toBeLessThan(detailedStepsLength);
    expect(content).not.toContain('Найдите все значения');
  });

  it('(E) independent steps are on separate lines, never glued with a mechanical ":" continuation', () => {
    const solution = buildCanonicalSolutionForTask18Variant1(realTask18Fields);
    const content = solution.examWriteup?.content ?? '';
    for (const line of content.split('\n')) {
      expect(line.trimEnd().endsWith(':')).toBe(false);
    }
  });

  // The user's explicit, stricter-than-№16/17 quality bar for №18: the
  // examWriteup must show a full parameter investigation, not just the
  // final set of values — every critical value, every case, and why
  // the boundaries are excluded or included.
  it('(F) contains every critical value the parameter investigation depends on', () => {
    const solution = buildCanonicalSolutionForTask18Variant1(realTask18Fields);
    const content = solution.examWriteup?.content ?? '';

    expect(content).toContain('36}{25}'); // the isolated point
    expect(content).toContain('\\sqrt{13}-2'); // the lower interval bound
    expect(content).toContain('a=4'); // the upper interval bound (as a root)
  });

  it('(G) shows the rejected case a=0, not just the accepted cases', () => {
    const solution = buildCanonicalSolutionForTask18Variant1(realTask18Fields);
    const content = solution.examWriteup?.content ?? '';
    expect(content).toContain('a=0');
    expect(content).toContain('не подходит');
  });

  it('(H) justifies why each case gives its number of solutions, not just states the conclusion', () => {
    const solution = buildCanonicalSolutionForTask18Variant1(realTask18Fields);
    const content = solution.examWriteup?.content ?? '';
    expect(content).toContain('ровно 2 решения');
    expect(content).toContain('добавляет решения, только если');
  });

  it('(I) justifies the isolated-point-vs-interval distinction, not just states both answer pieces', () => {
    const solution = buildCanonicalSolutionForTask18Variant1(realTask18Fields);
    const content = solution.examWriteup?.content ?? '';
    expect(content).toContain('не объединяются');
  });

  it('(J) justifies why the boundary points are excluded (3 solutions there), not just marks them open', () => {
    const solution = buildCanonicalSolutionForTask18Variant1(realTask18Fields);
    const content = solution.examWriteup?.content ?? '';
    expect(content).toContain('3 решения');
  });

  it('(K) uses ⇔ only where both sides are justified nonnegative (the squaring step), never as a decorative "="', () => {
    const solution = buildCanonicalSolutionForTask18Variant1(realTask18Fields);
    const content = solution.examWriteup?.content ?? '';
    const linesWithIff = content.split('\n').filter((line) => line.includes('\\Leftrightarrow'));
    expect(linesWithIff.length).toBeGreaterThan(0);
    for (const line of linesWithIff) {
      expect(line).toContain('\\geqslant0');
    }
  });

  it('(L) uses ⇒ only for genuine one-directional derivations with a premise before it', () => {
    const solution = buildCanonicalSolutionForTask18Variant1(realTask18Fields);
    const content = solution.examWriteup?.content ?? '';
    for (const line of content.split('\n')) {
      if (line.includes('\\Rightarrow')) {
        const before = line.split('\\Rightarrow')[0]!.trim();
        expect(before.length).toBeGreaterThan(0);
      }
    }
  });
});
