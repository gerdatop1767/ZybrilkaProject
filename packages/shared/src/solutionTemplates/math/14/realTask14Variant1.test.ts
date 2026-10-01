import { describe, expect, it } from 'vitest';
import {
  SolutionTemplateRegistry,
  ValidationRuleRegistry,
  registerGenericValidators,
  runCanonicalSolutionPipeline,
  type TaskTypeContext,
} from '../../../solutionEngine/index.js';
import { mathTask14StereometryTemplate, registerMathTask14Templates } from './stereometry.v1.js';
import { buildCanonicalSolutionForTask14Variant1 } from './realTask14Variant1.js';

// Real field values, copied verbatim from
// packages/db/src/importEge2026Variant1.ts (taskNumber: 14) — not
// invented for this test. A stable test UUID stands in for the real
// DB-generated id, which doesn't exist until the row is inserted.
const REAL_TASK_14_ID = '00000000-0000-0000-0000-000000000014';
const realTask14Fields = {
  taskId: REAL_TASK_14_ID,
  correctAnswer: 'arccos(√10/5)',
  correctAnswerDisplay: '$\\arccos\\dfrac{\\sqrt{10}}{5}$',
};

function makeRegistries() {
  const templateRegistry = new SolutionTemplateRegistry();
  registerMathTask14Templates(templateRegistry);
  const validationRegistry = new ValidationRuleRegistry();
  registerGenericValidators(validationRegistry);
  return { templateRegistry, validationRegistry };
}

describe('real task 14 — full pipeline', () => {
  const task: TaskTypeContext = { id: REAL_TASK_14_ID, subjectId: 'math', taskNumber: 14 };

  it('(A) resolves to the math:14 stereometry template', () => {
    const { templateRegistry } = makeRegistries();
    expect(templateRegistry.resolve('math:14')).toBe(mathTask14StereometryTemplate);
  });

  it('(B) builds a CanonicalSolution with exactly two parts (a, b)', () => {
    const solution = buildCanonicalSolutionForTask14Variant1(realTask14Fields);
    expect(solution.parts.map((p) => p.id)).toEqual(['a', 'b']);
  });

  it('(C) part а) is a proof — no checkable answer; part б) has the real correctAnswer', () => {
    const solution = buildCanonicalSolutionForTask14Variant1(realTask14Fields);
    const partA = solution.parts.find((p) => p.id === 'a')!;
    const partB = solution.parts.find((p) => p.id === 'b')!;

    expect(partA.hasCheckableAnswer).toBe(false);
    expect(partA.answer).toBeUndefined();

    expect(partB.hasCheckableAnswer).toBe(true);
    expect(partB.answer).toBe(realTask14Fields.correctAnswer);
    expect(partB.answerDisplay).toBe(realTask14Fields.correctAnswerDisplay);
  });

  it('(D) each part contains the expected canonical steps (real content, not placeholders)', () => {
    const solution = buildCanonicalSolutionForTask14Variant1(realTask14Fields);
    const partA = solution.parts.find((p) => p.id === 'a')!;
    const partB = solution.parts.find((p) => p.id === 'b')!;

    expect(partA.steps.map((s) => s.title)).toEqual([
      'Вводим координаты',
      'Находим точку N — пересечение DK с плоскостью SAC',
      'Строим прямую через N параллельно SC и находим отношение',
    ]);
    expect(partB.steps.map((s) => s.title)).toEqual([
      'Находим направляющие векторы',
      'Подставляем числовые значения',
      'Находим длины векторов',
      'Находим угол между прямыми',
    ]);
  });

  it('(E) template id/version are recorded on the built CanonicalSolution', () => {
    const solution = buildCanonicalSolutionForTask14Variant1(realTask14Fields);
    expect(solution.templateId).toBe(mathTask14StereometryTemplate.id);
    expect(solution.templateVersion).toBe(mathTask14StereometryTemplate.version);
  });

  it('(F) the full pipeline resolves the template, builds the solution, and validation passes', () => {
    const { templateRegistry, validationRegistry } = makeRegistries();
    const canonicalSolution = buildCanonicalSolutionForTask14Variant1(realTask14Fields);

    const result = runCanonicalSolutionPipeline(task, canonicalSolution, {
      templateRegistry,
      validationRegistry,
    });

    expect(result.status).toBe('validated');
    expect(result.template).toBe(mathTask14StereometryTemplate);
    expect(result.canonicalSolution).toBe(canonicalSolution);
    expect(result.validationResults.every((r) => r.passed)).toBe(true);
    expect(result.validationResults.map((r) => r.ruleId).sort()).toEqual(
      ['has-both-parts', 'has-content'].sort(),
    );
  });

  it('a task 14 built WITHOUT the proof (part а) fails has-both-parts', () => {
    const { templateRegistry, validationRegistry } = makeRegistries();
    const fullSolution = buildCanonicalSolutionForTask14Variant1(realTask14Fields);
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

describe('real task 14 — critical points', () => {
  it('(A) contains the expected critical points, each with a source', () => {
    const solution = buildCanonicalSolutionForTask14Variant1(realTask14Fields);
    const ids = solution.criticalPoints?.map((p) => p.id).sort();

    expect(ids).toEqual(
      [
        'full-credit-requires-both-parts',
        'proof-must-stand-on-its-own',
        'part-b-needs-justification',
        'angle-between-lines-absolute-value',
        'plane-SAC-equation-justification',
        'free-method-disclaimer',
      ].sort(),
    );
  });

  it('(B) every source is one of the three honest tiers, and the rubric-derived points are tagged secondary_source_verified, never fipi_verified', () => {
    const solution = buildCanonicalSolutionForTask14Variant1(realTask14Fields);
    const bySource = (
      source: 'fipi_verified' | 'secondary_source_verified' | 'project_quality_rule',
    ) => solution.criticalPoints!.filter((p) => p.source === source).map((p) => p.id);

    // Never claimed as directly confirmed against the primary FIPI
    // document — doc.fipi.ru was unreachable this session (see module
    // doc). This is the exact distinction the project asked to keep honest.
    expect(bySource('fipi_verified')).toEqual([]);
    expect(bySource('secondary_source_verified').sort()).toEqual(
      [
        'full-credit-requires-both-parts',
        'proof-must-stand-on-its-own',
        'part-b-needs-justification',
        'free-method-disclaimer',
      ].sort(),
    );
    expect(bySource('project_quality_rule').sort()).toEqual(
      ['angle-between-lines-absolute-value', 'plane-SAC-equation-justification'].sort(),
    );
  });

  it('(C) points are correctly linked to part а) / part б) / the whole solution', () => {
    const solution = buildCanonicalSolutionForTask14Variant1(realTask14Fields);
    const byId = (id: string) => solution.criticalPoints!.find((p) => p.id === id)!;

    expect(byId('full-credit-requires-both-parts').partId).toBeUndefined();
    expect(byId('proof-must-stand-on-its-own').partId).toBe('a');
    expect(byId('plane-SAC-equation-justification').partId).toBe('a');
    expect(byId('part-b-needs-justification').partId).toBe('b');
    expect(byId('angle-between-lines-absolute-value').partId).toBe('b');
  });

  it('(D) the presentation point (free method) is never required — FIPI explicitly allows multiple methods for №14', () => {
    const solution = buildCanonicalSolutionForTask14Variant1(realTask14Fields);
    const point = solution.criticalPoints!.find((p) => p.id === 'free-method-disclaimer')!;
    expect(point.category).toBe('presentation');
    expect(point.required).toBe(false);
  });

  it('(E) a required structural point (has-both-parts) is satisfied when both parts are present', () => {
    const { templateRegistry, validationRegistry } = makeRegistries();
    const solution = buildCanonicalSolutionForTask14Variant1(realTask14Fields);
    const task: TaskTypeContext = { id: REAL_TASK_14_ID, subjectId: 'math', taskNumber: 14 };

    const result = runCanonicalSolutionPipeline(task, solution, {
      templateRegistry,
      validationRegistry,
    });

    const check = result.criticalPointChecks.find(
      (c) => c.criticalPointId === 'full-credit-requires-both-parts',
    );
    expect(check?.status).toBe('satisfied');
  });

  it('(F) the logical-dependency point (proof-must-stand-on-its-own) stays unlinked — a structural validator cannot detect it', () => {
    const { templateRegistry, validationRegistry } = makeRegistries();
    const solution = buildCanonicalSolutionForTask14Variant1(realTask14Fields);
    const task: TaskTypeContext = { id: REAL_TASK_14_ID, subjectId: 'math', taskNumber: 14 };

    const result = runCanonicalSolutionPipeline(task, solution, {
      templateRegistry,
      validationRegistry,
    });

    const check = result.criticalPointChecks.find(
      (c) => c.criticalPointId === 'proof-must-stand-on-its-own',
    );
    expect(check?.status).toBe('unlinked');
    expect(result.status).toBe('validated');
  });
});

describe('real task 14 — exam writeup', () => {
  it('(A) has a compact examWriteup', () => {
    const solution = buildCanonicalSolutionForTask14Variant1(realTask14Fields);
    expect(solution.examWriteup?.content).toBeTruthy();
  });

  it('(B) contains both part а) and part б)', () => {
    const solution = buildCanonicalSolutionForTask14Variant1(realTask14Fields);
    const content = solution.examWriteup?.content ?? '';
    expect(content).toContain('а)');
    expect(content).toContain('б)');
  });

  it('(C) ends with the final answer, matching correctAnswerDisplay', () => {
    const solution = buildCanonicalSolutionForTask14Variant1(realTask14Fields);
    const content = solution.examWriteup?.content ?? '';
    expect(content.trim().endsWith(`Ответ: ${realTask14Fields.correctAnswerDisplay}`)).toBe(true);
  });

  it('(D) is compact — shorter than the detailed steps, and never duplicates the task condition', () => {
    const solution = buildCanonicalSolutionForTask14Variant1(realTask14Fields);
    const content = solution.examWriteup?.content ?? '';
    const detailedStepsLength = solution.parts
      .flatMap((part) => part.steps)
      .reduce((sum, step) => sum + step.explanation.length, 0);
    expect(content.length).toBeLessThan(detailedStepsLength);
    expect(content).not.toContain('Докажите');
    expect(content).not.toContain('пирамиде');
  });

  it('(E) independent equations/steps are on separate lines, not glued into one formula (same audit lesson as №13)', () => {
    const solution = buildCanonicalSolutionForTask14Variant1(realTask14Fields);
    const content = solution.examWriteup?.content ?? '';
    // The N-finding chain and the angle chain must not be glued into
    // one formula each spanning two separate conceptual facts.
    expect(content).not.toMatch(/N=[^$]*\\Rightarrow[^$]*\\Rightarrow/);
  });

  it('(F) no mechanical trailing ":" right before the next line continues', () => {
    const solution = buildCanonicalSolutionForTask14Variant1(realTask14Fields);
    const content = solution.examWriteup?.content ?? '';
    for (const line of content.split('\n')) {
      expect(line.trimEnd().endsWith(':')).toBe(false);
    }
  });

  it('(G) contains the proof conclusion, not just the final numeric answer', () => {
    const solution = buildCanonicalSolutionForTask14Variant1(realTask14Fields);
    const content = solution.examWriteup?.content ?? '';
    expect(content).toContain('требовалось доказать');
  });
});
