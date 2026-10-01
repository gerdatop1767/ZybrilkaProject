import { describe, expect, it } from 'vitest';
import {
  SolutionTemplateRegistry,
  ValidationRuleRegistry,
  registerGenericValidators,
  runCanonicalSolutionPipeline,
  type TaskTypeContext,
} from '../../../solutionEngine/index.js';
import { serializeMultiPartSpec } from '../../../multiPartAnswer.js';
import { mathTask19NumberTheoryTemplate, registerMathTask19Templates } from './numberTheory.v1.js';
import { buildCanonicalSolutionForTask19Variant1 } from './realTask19Variant1.js';

// Real field values, copied verbatim from
// packages/db/src/importEge2026Variant1.ts (taskNumber: 19) — not
// invented for this test. A stable test UUID stands in for the real
// DB-generated id, which doesn't exist until the row is inserted.
const REAL_TASK_19_ID = '00000000-0000-0000-0000-000000000019';
const realTask19Fields = {
  taskId: REAL_TASK_19_ID,
  correctAnswer: serializeMultiPartSpec({
    parts: [
      { id: 'a', label: 'а', answerType: 'short_answer', correctAnswer: 'нет' },
      { id: 'b', label: 'б', answerType: 'short_answer', correctAnswer: '607' },
      { id: 'c', label: 'в', answerType: 'short_answer', correctAnswer: '1066' },
    ],
  }),
  correctAnswerDisplay: null,
};

function makeRegistries() {
  const templateRegistry = new SolutionTemplateRegistry();
  registerMathTask19Templates(templateRegistry);
  const validationRegistry = new ValidationRuleRegistry();
  registerGenericValidators(validationRegistry);
  return { templateRegistry, validationRegistry };
}

// Independent brute-force search over every integer (Б,М) pair in the
// task's own stated ranges — does NOT reuse any logic from the
// content builder or from explanationMd's narrative. This is the
// ground truth every other check in this file is measured against.
function bruteForceSearch(): readonly { k: number; B: number; M: number; N: number }[] {
  const results: { k: number; B: number; M: number; N: number }[] = [];
  for (let B = 151; B <= 159; B++) {
    for (let M = 101; M <= 119; M++) {
      const num = 2 * M;
      const den = B - M;
      if (den > 0 && num % den === 0) {
        const k = num / den;
        if (k >= 1) {
          const N1 = k * B - 5;
          const N2 = (k + 2) * M - 5;
          if (N1 === N2) results.push({ k, B, M, N: N1 });
        }
      }
    }
  }
  return results;
}

describe('real task 19 — independent mathematical re-derivation', () => {
  // This does NOT trust explanationMd — it re-derives the k-bound,
  // the per-k divisibility conditions, the band disjointness
  // argument, and the brute-force ground truth independently, then
  // cross-checks that they all agree with each other and with the
  // task's own correctAnswer.
  it('the universal bound on k (derived from Б∈[151,159], М∈[101,119]) gives exactly k∈{4,5,6,7}', () => {
    const lower = 202 / 58; // 2*M_min / (B-M)_max
    const upper = 238 / 32; // 2*M_max / (B-M)_min
    const possibleK = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter((k) => k >= lower && k <= upper);
    expect(possibleK).toEqual([4, 5, 6, 7]);
  });

  it("k=3 is excluded by the bound alone, confirming part а)'s answer independently of any multiples-of-3 search", () => {
    const lower = 202 / 58;
    expect(3).toBeLessThan(lower);
  });

  it("the brute-force ground truth finds exactly explanationMd's 7 triples, confirming the DB's own explanation is accurate here", () => {
    const found = bruteForceSearch();
    expect(found).toHaveLength(7);
    const Ns = found.map((r) => r.N).sort((a, b) => a - b);
    expect(Ns).toEqual([607, 619, 631, 765, 907, 931, 1066]);
  });

  it('the per-k N-ranges [151k-5, 159k-5] are pairwise disjoint and strictly increasing for k=4..7', () => {
    const ranges = [4, 5, 6, 7].map((k) => ({ k, min: 151 * k - 5, max: 159 * k - 5 }));
    for (let i = 0; i < ranges.length - 1; i++) {
      expect(ranges[i]!.max).toBeLessThan(ranges[i + 1]!.min);
    }
  });

  it('every brute-force result for k=4 is smaller than every brute-force result for k=5,6,7 (confirms skipping k=5,6 for the minimum is sound)', () => {
    const found = bruteForceSearch();
    const k4 = found.filter((r) => r.k === 4).map((r) => r.N);
    const others = found.filter((r) => r.k !== 4).map((r) => r.N);
    expect(Math.max(...k4)).toBeLessThan(Math.min(...others));
  });

  it('every brute-force result for k=7 is larger than every brute-force result for k=4,5,6 (confirms skipping k=5,6 for the maximum is sound)', () => {
    const found = bruteForceSearch();
    const k7 = found.filter((r) => r.k === 7).map((r) => r.N);
    const others = found.filter((r) => r.k !== 7).map((r) => r.N);
    expect(Math.min(...k7)).toBeGreaterThan(Math.max(...others));
  });

  it('the divisibility condition k∣2M correctly predicts exactly the brute-force solutions for k=4 and k=7 (necessary AND sufficient)', () => {
    const found = bruteForceSearch();
    for (const k of [4, 7]) {
      const predicted: { B: number; M: number }[] = [];
      for (let M = 101; M <= 119; M++) {
        if ((2 * M) % k === 0) {
          const B = ((k + 2) * M) / k;
          if (Number.isInteger(B) && B >= 151 && B <= 159) predicted.push({ B, M });
        }
      }
      const actual = found.filter((r) => r.k === k).map((r) => ({ B: r.B, M: r.M }));
      expect(predicted.sort((a, b) => a.M - b.M)).toEqual(actual.sort((a, b) => a.M - b.M));
    }
  });

  it("the minimum (607) and maximum (1066) independently found here match the task's own correctAnswer exactly", () => {
    const found = bruteForceSearch();
    const Ns = found.map((r) => r.N);
    expect(Math.min(...Ns)).toBe(607);
    expect(Math.max(...Ns)).toBe(1066);
  });
});

describe('real task 19 — full pipeline', () => {
  const task: TaskTypeContext = { id: REAL_TASK_19_ID, subjectId: 'math', taskNumber: 19 };

  it('(A) resolves to the math:19 number-theory template', () => {
    const { templateRegistry } = makeRegistries();
    expect(templateRegistry.resolve('math:19')).toBe(mathTask19NumberTheoryTemplate);
  });

  it('(B) builds a CanonicalSolution with exactly three parts (a, b, c)', () => {
    const solution = buildCanonicalSolutionForTask19Variant1(realTask19Fields);
    expect(solution.parts.map((p) => p.id)).toEqual(['a', 'b', 'c']);
  });

  it('(C) each part has its own real correctAnswer, parsed from the MultiPartSpec JSON, not re-typed by hand', () => {
    const solution = buildCanonicalSolutionForTask19Variant1(realTask19Fields);
    const partA = solution.parts.find((p) => p.id === 'a')!;
    const partB = solution.parts.find((p) => p.id === 'b')!;
    const partC = solution.parts.find((p) => p.id === 'c')!;

    expect(partA.hasCheckableAnswer).toBe(true);
    expect(partA.answer).toBe('нет');
    expect(partB.hasCheckableAnswer).toBe(true);
    expect(partB.answer).toBe('607');
    expect(partC.hasCheckableAnswer).toBe(true);
    expect(partC.answer).toBe('1066');
  });

  it('(D) each part contains the expected canonical steps (real content, not placeholders)', () => {
    const solution = buildCanonicalSolutionForTask19Variant1(realTask19Fields);
    const partA = solution.parts.find((p) => p.id === 'a')!;
    const partB = solution.parts.find((p) => p.id === 'b')!;
    const partC = solution.parts.find((p) => p.id === 'c')!;

    expect(partA.steps.map((s) => s.title)).toEqual([
      'Составляем уравнение',
      'Находим границы для k и отвечаем на пункт а',
    ]);
    expect(partB.steps.map((s) => s.title)).toEqual([
      'Оцениваем диапазон N для каждого k',
      'Разбираем k = 4 и находим наименьшее N',
    ]);
    expect(partC.steps.map((s) => s.title)).toEqual([
      'Разбираем k = 7 и находим наибольшее N',
      'Обосновываем, что это наибольшее возможное N',
    ]);

    expect(partA.steps.find((s) => s.id === 'a2')?.kind).toBe('bound_derivation');
    expect(partB.steps.find((s) => s.id === 'b2')?.kind).toBe('exhaustive_case_check');
    expect(partC.steps.find((s) => s.id === 'c1')?.kind).toBe('exhaustive_case_check');
  });

  it('(E) template id/version are recorded on the built CanonicalSolution', () => {
    const solution = buildCanonicalSolutionForTask19Variant1(realTask19Fields);
    expect(solution.templateId).toBe(mathTask19NumberTheoryTemplate.id);
    expect(solution.templateVersion).toBe(mathTask19NumberTheoryTemplate.version);
  });

  it('(F) the full pipeline resolves the template, builds the solution, and validation passes', () => {
    const { templateRegistry, validationRegistry } = makeRegistries();
    const canonicalSolution = buildCanonicalSolutionForTask19Variant1(realTask19Fields);

    const result = runCanonicalSolutionPipeline(task, canonicalSolution, {
      templateRegistry,
      validationRegistry,
    });

    expect(result.status).toBe('validated');
    expect(result.template).toBe(mathTask19NumberTheoryTemplate);
    expect(result.canonicalSolution).toBe(canonicalSolution);
    expect(result.validationResults.every((r) => r.passed)).toBe(true);
    expect(result.validationResults.map((r) => r.ruleId).sort()).toEqual(
      [
        'has-all-parts',
        'has-content',
        'has-bound-derivation-step',
        'has-exhaustive-case-check-step',
      ].sort(),
    );
  });

  it('a task 19 built WITHOUT part в) (c) fails has-all-parts', () => {
    const { templateRegistry, validationRegistry } = makeRegistries();
    const fullSolution = buildCanonicalSolutionForTask19Variant1(realTask19Fields);
    const missingPartC = { ...fullSolution, parts: fullSolution.parts.filter((p) => p.id !== 'c') };

    const result = runCanonicalSolutionPipeline(task, missingPartC, {
      templateRegistry,
      validationRegistry,
    });

    expect(result.status).toBe('validation_failed');
    const partsResult = result.validationResults.find((r) => r.ruleId === 'has-all-parts');
    expect(partsResult?.passed).toBe(false);
  });

  it('throws a clear error if correctAnswer is not valid MultiPartSpec JSON (never silently builds a wrong solution)', () => {
    expect(() =>
      buildCanonicalSolutionForTask19Variant1({
        taskId: REAL_TASK_19_ID,
        correctAnswer: 'not valid json',
        correctAnswerDisplay: null,
      }),
    ).toThrow();
  });
});

describe('real task 19 — critical points', () => {
  it('(A) contains the expected critical points, each with a source', () => {
    const solution = buildCanonicalSolutionForTask19Variant1(realTask19Fields);
    const ids = solution.criticalPoints?.map((p) => p.id).sort();

    expect(ids).toEqual(
      [
        'full-justification-required-per-component',
        'bound-and-example-both-required-for-b-and-c',
        'k-bound-must-be-derived-not-assumed',
        'part-a-follows-directly-from-k-bound',
        'divisibility-condition-must-be-necessary-and-sufficient',
        'skipping-k-5-6-must-be-explicitly-justified',
        'free-method-disclaimer',
      ].sort(),
    );
  });

  it('(B) rubric-derived points are tagged secondary_source_verified, never fipi_verified', () => {
    const solution = buildCanonicalSolutionForTask19Variant1(realTask19Fields);
    const bySource = (
      source: 'fipi_verified' | 'secondary_source_verified' | 'project_quality_rule',
    ) => solution.criticalPoints!.filter((p) => p.source === source).map((p) => p.id);

    expect(bySource('fipi_verified')).toEqual([]);
    expect(bySource('secondary_source_verified').sort()).toEqual(
      [
        'full-justification-required-per-component',
        'bound-and-example-both-required-for-b-and-c',
        'free-method-disclaimer',
      ].sort(),
    );
    expect(bySource('project_quality_rule').sort()).toEqual(
      [
        'k-bound-must-be-derived-not-assumed',
        'part-a-follows-directly-from-k-bound',
        'divisibility-condition-must-be-necessary-and-sufficient',
        'skipping-k-5-6-must-be-explicitly-justified',
      ].sort(),
    );
  });

  it('(C) a required structural point (has-bound-derivation-step) is satisfied when the bound step is present', () => {
    const { templateRegistry, validationRegistry } = makeRegistries();
    const solution = buildCanonicalSolutionForTask19Variant1(realTask19Fields);
    const task: TaskTypeContext = { id: REAL_TASK_19_ID, subjectId: 'math', taskNumber: 19 };

    const result = runCanonicalSolutionPipeline(task, solution, {
      templateRegistry,
      validationRegistry,
    });

    const check = result.criticalPointChecks.find(
      (c) => c.criticalPointId === 'k-bound-must-be-derived-not-assumed',
    );
    expect(check?.status).toBe('satisfied');
  });

  it('(D) the purely logical/mathematical correctness points stay unlinked — no structural validator can verify them', () => {
    const { templateRegistry, validationRegistry } = makeRegistries();
    const solution = buildCanonicalSolutionForTask19Variant1(realTask19Fields);
    const task: TaskTypeContext = { id: REAL_TASK_19_ID, subjectId: 'math', taskNumber: 19 };

    const result = runCanonicalSolutionPipeline(task, solution, {
      templateRegistry,
      validationRegistry,
    });

    for (const id of [
      'part-a-follows-directly-from-k-bound',
      'divisibility-condition-must-be-necessary-and-sufficient',
      'skipping-k-5-6-must-be-explicitly-justified',
    ]) {
      const check = result.criticalPointChecks.find((c) => c.criticalPointId === id);
      expect(check?.status).toBe('unlinked');
    }
    expect(result.status).toBe('validated');
  });

  it('(E) the presentation point (free method) is never required', () => {
    const solution = buildCanonicalSolutionForTask19Variant1(realTask19Fields);
    const point = solution.criticalPoints!.find((p) => p.id === 'free-method-disclaimer')!;
    expect(point.category).toBe('presentation');
    expect(point.required).toBe(false);
  });
});

describe('real task 19 — exam writeup (strictest standard yet: full justified chain for three parts)', () => {
  it('(A) has a non-empty examWriteup', () => {
    const solution = buildCanonicalSolutionForTask19Variant1(realTask19Fields);
    expect(solution.examWriteup?.content).toBeTruthy();
  });

  it('(B) contains all three parts а), б), в)', () => {
    const solution = buildCanonicalSolutionForTask19Variant1(realTask19Fields);
    const content = solution.examWriteup?.content ?? '';
    expect(content).toContain('а)');
    expect(content).toContain('б)');
    expect(content).toContain('в)');
  });

  it('(C) ends with the final в) answer (1066)', () => {
    const solution = buildCanonicalSolutionForTask19Variant1(realTask19Fields);
    const content = solution.examWriteup?.content ?? '';
    expect(content.trim().endsWith('Ответ: 1066')).toBe(true);
  });

  it('(D) is compact — shorter than the detailed steps, and never duplicates the task condition', () => {
    const solution = buildCanonicalSolutionForTask19Variant1(realTask19Fields);
    const content = solution.examWriteup?.content ?? '';
    const detailedStepsLength = solution.parts
      .flatMap((part) => part.steps)
      .reduce((sum, step) => sum + step.explanation.length, 0);
    expect(content.length).toBeLessThan(detailedStepsLength);
    expect(content).not.toContain('Иван Ильич');
    expect(content).not.toContain('разложить');
  });

  it('(E) independent steps are on separate lines, never glued with a mechanical ":" continuation', () => {
    const solution = buildCanonicalSolutionForTask19Variant1(realTask19Fields);
    const content = solution.examWriteup?.content ?? '';
    for (const line of content.split('\n')) {
      expect(line.trimEnd().endsWith(':')).toBe(false);
    }
  });

  // The user's explicit, strictest-yet quality bar for №19: every
  // component the FIPI rubric scores (а, б's bound, б's example, в's
  // bound, в's example) must be visibly present and justified, not
  // just the three final numbers.
  it('(F) contains the universal k-bound derivation with its inequality justification, not just the conclusion', () => {
    const solution = buildCanonicalSolutionForTask19Variant1(realTask19Fields);
    const content = solution.examWriteup?.content ?? '';
    expect(content).toContain('202'); // 2*M_min
    expect(content).toContain('58'); // (B-M)_max
    expect(content).toContain('k\\in\\{4,5,6,7\\}');
  });

  it('(G) justifies why а) follows from the k-bound, not just states "нет"', () => {
    const solution = buildCanonicalSolutionForTask19Variant1(realTask19Fields);
    const content = solution.examWriteup?.content ?? '';
    expect(content).toContain('k=3\\notin\\{4,5,6,7\\}');
  });

  it('(H) justifies the divisibility conditions for both k=4 and k=7 as equivalences (⇔), not bare assertions', () => {
    const solution = buildCanonicalSolutionForTask19Variant1(realTask19Fields);
    const content = solution.examWriteup?.content ?? '';
    const linesWithIff = content.split('\n').filter((l) => l.includes('\\Leftrightarrow'));
    expect(linesWithIff.length).toBeGreaterThanOrEqual(3);
  });

  it('(I) shows the band-disjointness argument justifying why k=5,6 are skipped, not a silent omission', () => {
    const solution = buildCanonicalSolutionForTask19Variant1(realTask19Fields);
    const content = solution.examWriteup?.content ?? '';
    expect(content).toContain('не пересекаются');
    expect(content).toContain('1052');
  });

  it('(J) shows both the bound/estimate AND the concrete achieving example for б) and в), not just the final numbers', () => {
    const solution = buildCanonicalSolutionForTask19Variant1(realTask19Fields);
    const content = solution.examWriteup?.content ?? '';
    // б)'s example: the (B,M) triple achieving 607.
    expect(content).toContain('153,102');
    // в)'s example: the (B,M) triple achieving 1066.
    expect(content).toContain('153\\in[151,159]');
  });

  it('(K) uses ⇒ only for genuine one-directional derivations with a premise before it', () => {
    const solution = buildCanonicalSolutionForTask19Variant1(realTask19Fields);
    const content = solution.examWriteup?.content ?? '';
    for (const line of content.split('\n')) {
      if (line.includes('\\Rightarrow')) {
        const before = line.split('\\Rightarrow')[0]!.trim();
        expect(before.length).toBeGreaterThan(0);
      }
    }
  });
});
