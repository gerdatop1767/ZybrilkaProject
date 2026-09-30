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

describe('real task 13 — critical points', () => {
  const task: TaskTypeContext = { id: REAL_TASK_13_ID, subjectId: 'math', taskNumber: 13 };

  it('(9A) contains the expected critical points, each with a source', () => {
    const solution = buildCanonicalSolutionForTask13Variant1(realTask13Fields);
    const ids = solution.criticalPoints?.map((p) => p.id).sort();

    expect(ids).toEqual(
      [
        'part-a-required',
        'justified-reasoning-required',
        'sqrt-nonnegativity-condition',
        'free-form-method-and-writeup',
      ].sort(),
    );
    expect(
      solution.criticalPoints?.every(
        (p) => p.source === 'fipi_verified' || p.source === 'project_quality_rule',
      ),
    ).toBe(true);
  });

  it('(9A) FIPI-sourced points and the one internal project rule are correctly distinguished', () => {
    const solution = buildCanonicalSolutionForTask13Variant1(realTask13Fields);
    const bySource = (source: 'fipi_verified' | 'project_quality_rule') =>
      solution.criticalPoints!.filter((p) => p.source === source).map((p) => p.id);

    expect(bySource('fipi_verified').sort()).toEqual(
      ['part-a-required', 'justified-reasoning-required', 'free-form-method-and-writeup'].sort(),
    );
    expect(bySource('project_quality_rule')).toEqual(['sqrt-nonnegativity-condition']);
  });

  it('(9B) points are correctly linked to part a / part b / the whole solution', () => {
    const solution = buildCanonicalSolutionForTask13Variant1(realTask13Fields);
    const byId = (id: string) => solution.criticalPoints!.find((p) => p.id === id)!;

    expect(byId('part-a-required').partId).toBe('a');
    expect(byId('sqrt-nonnegativity-condition').partId).toBe('a');
    // Applies to the whole solution, not one part — partId intentionally absent.
    expect(byId('justified-reasoning-required').partId).toBeUndefined();
    expect(byId('free-form-method-and-writeup').partId).toBeUndefined();
  });

  it('(9C) a required structural point (part-a-required) is satisfied when part а) is present', () => {
    const { templateRegistry, validationRegistry } = makeRegistries();
    const solution = buildCanonicalSolutionForTask13Variant1(realTask13Fields);

    const result = runCanonicalSolutionPipeline(task, solution, {
      templateRegistry,
      validationRegistry,
    });

    const check = result.criticalPointChecks.find((c) => c.criticalPointId === 'part-a-required');
    expect(check?.status).toBe('satisfied');
  });

  it('(9D) part-a-required becomes not_satisfied, predictably, when part а) is missing', () => {
    const { templateRegistry, validationRegistry } = makeRegistries();
    const fullSolution = buildCanonicalSolutionForTask13Variant1(realTask13Fields);
    const missingPartA = { ...fullSolution, parts: fullSolution.parts.filter((p) => p.id !== 'a') };

    const result = runCanonicalSolutionPipeline(task, missingPartA, {
      templateRegistry,
      validationRegistry,
    });

    const check = result.criticalPointChecks.find((c) => c.criticalPointId === 'part-a-required');
    expect(check?.status).toBe('not_satisfied');
    // The whole pipeline result reflects it too (via validationResults, not the critical point itself).
    expect(result.status).toBe('validation_failed');
  });

  it('(9E) the presentation point never gates validation — stays unlinked even when everything else passes', () => {
    const { templateRegistry, validationRegistry } = makeRegistries();
    const solution = buildCanonicalSolutionForTask13Variant1(realTask13Fields);

    const result = runCanonicalSolutionPipeline(task, solution, {
      templateRegistry,
      validationRegistry,
    });

    const presentationCheck = result.criticalPointChecks.find(
      (c) => c.criticalPointId === 'free-form-method-and-writeup',
    );
    expect(presentationCheck?.status).toBe('unlinked');
    expect(result.status).toBe('validated');

    // The one internal (non-FIPI) correctness point has no automated
    // check either — deliberately left unlinked this stage (see
    // module doc) — and it likewise never gates validation.
    const correctnessCheck = result.criticalPointChecks.find(
      (c) => c.criticalPointId === 'sqrt-nonnegativity-condition',
    );
    expect(correctnessCheck?.status).toBe('unlinked');
  });

  it('(9F) critical point text is natural Russian — never leaks the raw English phrase "canonical solution"', () => {
    const solution = buildCanonicalSolutionForTask13Variant1(realTask13Fields);

    for (const point of solution.criticalPoints ?? []) {
      expect(point.text.toLowerCase()).not.toContain('canonical solution');
    }
  });
});

describe('real task 13 — exam writeup', () => {
  it('(A) has a compact examWriteup', () => {
    const solution = buildCanonicalSolutionForTask13Variant1(realTask13Fields);
    expect(solution.examWriteup?.content).toBeTruthy();
  });

  it('(E) contains both part а) and part б)', () => {
    const solution = buildCanonicalSolutionForTask13Variant1(realTask13Fields);
    const content = solution.examWriteup?.content ?? '';
    expect(content).toContain('а)');
    expect(content).toContain('б)');
  });

  it('(F) ends with the final answer, matching correctAnswerDisplay', () => {
    const solution = buildCanonicalSolutionForTask13Variant1(realTask13Fields);
    const content = solution.examWriteup?.content ?? '';
    expect(content).toContain(`Ответ: ${realTask13Fields.correctAnswerDisplay}`);
  });

  it('is compact — shorter than the detailed steps, and never duplicates the task condition', () => {
    const solution = buildCanonicalSolutionForTask13Variant1(realTask13Fields);
    const content = solution.examWriteup?.content ?? '';
    const detailedStepsLength = solution.parts
      .flatMap((part) => part.steps)
      .reduce((sum, step) => sum + step.explanation.length, 0);
    expect(content.length).toBeLessThan(detailedStepsLength);
    // The condition is never restated (see module doc / task's own
    // conditionMd) — only the equivalence chain and the answer.
    expect(content).not.toContain('Решите уравнение');
  });

  // Audit finding 1: part б) used to show only the final roots, with no
  // derivation — in tension with the `justified-reasoning-required`
  // critical point ("не только финальным результатом"). These lock in
  // that the derivation (not just the answer) is actually present.
  it('(1) part б) shows more than just the final roots — the selection is derived, not asserted', () => {
    const solution = buildCanonicalSolutionForTask13Variant1(realTask13Fields);
    const content = solution.examWriteup?.content ?? '';
    const partBSection = content.slice(content.indexOf('б)'));
    // The bare final-roots line alone (old content) is not the whole
    // of part б) anymore — there's real derivation text before the answer.
    expect(partBSection.length).toBeGreaterThan(
      `б) ${realTask13Fields.correctAnswerDisplay}`.length + 20,
    );
  });

  it('(2) part б) derives the admissible n (from the πn series)', () => {
    const solution = buildCanonicalSolutionForTask13Variant1(realTask13Fields);
    const content = solution.examWriteup?.content ?? '';
    expect(content).toContain('n=-4');
    expect(content).toContain('-3');
    expect(content).toContain('x=-4\\pi');
  });

  it('(2) part б) derives the admissible k (from the -2π/3+2πk series)', () => {
    const solution = buildCanonicalSolutionForTask13Variant1(realTask13Fields);
    const content = solution.examWriteup?.content ?? '';
    expect(content).toContain('k=-1');
    expect(content).toContain('-\\dfrac{8\\pi}{3}');
  });

  it('(2) still ends with the final roots as the answer', () => {
    const solution = buildCanonicalSolutionForTask13Variant1(realTask13Fields);
    const content = solution.examWriteup?.content ?? '';
    expect(content.trim().endsWith(`Ответ: ${realTask13Fields.correctAnswerDisplay}`)).toBe(true);
  });

  // Audit finding 2: part а)'s general-solution formula used to be
  // retyped independently in `parts[0].answerDisplay` and in
  // `examWriteup` with different LaTeX formatting — a drift risk. This
  // locks in that both now come from the same content.
  // Audit finding (UX pass): the two branches used to be glued onto one
  // line in examWriteup (one `$...$` span joined by `;\quad`) — now each
  // renders on its own line, so this checks each branch individually
  // rather than the old single joined substring.
  it('(3) each branch of the general-solution formula in examWriteup matches part а) answerDisplay', () => {
    const solution = buildCanonicalSolutionForTask13Variant1(realTask13Fields);
    const partA = solution.parts.find((p) => p.id === 'a');
    const formulaTex = partA?.answerDisplay?.slice(1, -1); // strip the $...$ wrapper
    expect(formulaTex).toBeTruthy();
    const [branch1, branch2] = formulaTex!.split(';\\quad ');
    expect(branch1).toBeTruthy();
    expect(branch2).toBeTruthy();
    expect(solution.examWriteup?.content).toContain(branch1!);
    expect(solution.examWriteup?.content).toContain(branch2!);
  });

  it('(4) independent equations/steps are on separate lines, not glued into one formula', () => {
    const solution = buildCanonicalSolutionForTask13Variant1(realTask13Fields);
    const content = solution.examWriteup?.content ?? '';
    // The old bug: both general-solution branches inside one $...$ span.
    expect(content).not.toContain(';\\quad x=-\\dfrac{2\\pi}{3}');
    // The old bug: inequality ⇒ parameter ⇒ root all inside one $...$ span.
    expect(content).not.toMatch(/\\leqslant[^$]*\\Rightarrow[^$]*\\Rightarrow/);
  });

  it('(5) no mechanical trailing ":" right before the next line continues', () => {
    const solution = buildCanonicalSolutionForTask13Variant1(realTask13Fields);
    const content = solution.examWriteup?.content ?? '';
    for (const line of content.split('\n')) {
      expect(line.trimEnd().endsWith(':')).toBe(false);
    }
  });
});
