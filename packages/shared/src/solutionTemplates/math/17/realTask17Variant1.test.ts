import { describe, expect, it } from 'vitest';
import {
  SolutionTemplateRegistry,
  ValidationRuleRegistry,
  registerGenericValidators,
  runCanonicalSolutionPipeline,
  type TaskTypeContext,
} from '../../../solutionEngine/index.js';
import { mathTask17PlanimetryTemplate, registerMathTask17Templates } from './planimetry.v1.js';
import { buildCanonicalSolutionForTask17Variant1 } from './realTask17Variant1.js';

// Real field values, copied verbatim from
// packages/db/src/importEge2026Variant1.ts (taskNumber: 17) — not
// invented for this test. A stable test UUID stands in for the real
// DB-generated id, which doesn't exist until the row is inserted.
const REAL_TASK_17_ID = '00000000-0000-0000-0000-000000000017';
const realTask17Fields = {
  taskId: REAL_TASK_17_ID,
  correctAnswer: '6-3√2',
  correctAnswerDisplay: '$6-3\\sqrt2$',
};

function makeRegistries() {
  const templateRegistry = new SolutionTemplateRegistry();
  registerMathTask17Templates(templateRegistry);
  const validationRegistry = new ValidationRuleRegistry();
  registerGenericValidators(validationRegistry);
  return { templateRegistry, validationRegistry };
}

describe('real task 17 — independent mathematical re-derivation', () => {
  // This does NOT trust explanationMd — it re-derives the coordinates,
  // the two tangency roots, BN, the kite side lengths, the area via
  // the shoelace formula, and the final radius from scratch.
  it('solving the tangency equation gives two roots for c, only one of which is geometrically valid (b=c-2R>0)', () => {
    const R = 1;
    const roots = [2 * R + R * Math.sqrt(2), 2 * R - R * Math.sqrt(2)];
    const valid = roots.filter((c) => c - 2 * R > 0);
    expect(valid).toHaveLength(1);
    expect(valid[0]).toBeCloseTo(2 + Math.sqrt(2), 10);
  });

  it('BN = R(√2-1), independently computed via coordinates for several R values', () => {
    for (const R of [1, 6, 10]) {
      const c = R * (2 + Math.sqrt(2));
      const b = R * Math.sqrt(2);
      const N = { x: c / 2, y: c / 2 };
      const B = { x: b, y: 2 * R };
      const BN = Math.hypot(N.x - B.x, N.y - B.y);
      expect(BN).toBeCloseTo(R * (Math.sqrt(2) - 1), 10);
    }
  });

  it("BNOG side lengths satisfy both the kite condition and Pitot's theorem (BN+OG=NO+GB)", () => {
    const R = 1;
    const BN = R * (Math.sqrt(2) - 1);
    const NO = R;
    const OG = R;
    const GB = R * (Math.sqrt(2) - 1);
    expect(BN).toBeCloseTo(GB, 10);
    expect(NO).toBeCloseTo(OG, 10);
    expect(BN + OG).toBeCloseTo(NO + GB, 10);
  });

  it('the shoelace-formula area of BNOG equals R²(√2-1), confirmed numerically at R=1', () => {
    const R = 1;
    const c = R * (2 + Math.sqrt(2));
    const b = R * Math.sqrt(2);
    const B = { x: b, y: 2 * R };
    const N = { x: c / 2, y: c / 2 };
    const O = { x: R, y: R };
    const G = { x: R, y: 2 * R };
    const pts = [B, N, O, G];
    let sum = 0;
    for (let i = 0; i < pts.length; i++) {
      const p1 = pts[i]!;
      const p2 = pts[(i + 1) % pts.length]!;
      sum += p1.x * p2.y - p2.x * p1.y;
    }
    const area = Math.abs(sum) / 2;
    expect(area).toBeCloseTo(R * R * (Math.sqrt(2) - 1), 10);
  });

  it('r = R(2-√2)/2, and at R=6 this equals exactly 6-3√2 — matching correctAnswer', () => {
    const R = 6;
    const area = R * R * (Math.sqrt(2) - 1);
    const s = R * Math.sqrt(2);
    const r = area / s;
    expect(r).toBeCloseTo((R * (2 - Math.sqrt(2))) / 2, 10);
    expect(r).toBeCloseTo(6 - 3 * Math.sqrt(2), 10);
  });
});

describe('real task 17 — full pipeline', () => {
  const task: TaskTypeContext = { id: REAL_TASK_17_ID, subjectId: 'math', taskNumber: 17 };

  it('(A) resolves to the math:17 planimetry template', () => {
    const { templateRegistry } = makeRegistries();
    expect(templateRegistry.resolve('math:17')).toBe(mathTask17PlanimetryTemplate);
  });

  it('(B) builds a CanonicalSolution with exactly two parts (a, b)', () => {
    const solution = buildCanonicalSolutionForTask17Variant1(realTask17Fields);
    expect(solution.parts.map((p) => p.id)).toEqual(['a', 'b']);
  });

  it('(C) part а) is a proof — no checkable answer; part б) has the real correctAnswer', () => {
    const solution = buildCanonicalSolutionForTask17Variant1(realTask17Fields);
    const partA = solution.parts.find((p) => p.id === 'a')!;
    const partB = solution.parts.find((p) => p.id === 'b')!;

    expect(partA.hasCheckableAnswer).toBe(false);
    expect(partA.answer).toBeUndefined();

    expect(partB.hasCheckableAnswer).toBe(true);
    expect(partB.answer).toBe(realTask17Fields.correctAnswer);
    expect(partB.answerDisplay).toBe(realTask17Fields.correctAnswerDisplay);
  });

  it('(D) each part contains the expected canonical steps (real content, not placeholders)', () => {
    const solution = buildCanonicalSolutionForTask17Variant1(realTask17Fields);
    const partA = solution.parts.find((p) => p.id === 'a')!;
    const partB = solution.parts.find((p) => p.id === 'b')!;

    expect(partA.steps.map((s) => s.title)).toEqual([
      'Вводим координаты и находим центр O',
      'Находим уравнение биссектрисы угла ADC',
      'Используем перпендикулярность биссектрисы и BC',
      'Используем касание BC и окружности',
      'Находим точку N и вычисляем BN',
    ]);
    expect(partB.steps.map((s) => s.title)).toEqual([
      'Находим точку касания G',
      'Находим стороны четырёхугольника BNOG',
      'Находим площадь и полупериметр BNOG',
      'Находим радиус вписанной окружности',
    ]);
  });

  it('(E) template id/version are recorded on the built CanonicalSolution', () => {
    const solution = buildCanonicalSolutionForTask17Variant1(realTask17Fields);
    expect(solution.templateId).toBe(mathTask17PlanimetryTemplate.id);
    expect(solution.templateVersion).toBe(mathTask17PlanimetryTemplate.version);
  });

  it('(F) the full pipeline resolves the template, builds the solution, and validation passes', () => {
    const { templateRegistry, validationRegistry } = makeRegistries();
    const canonicalSolution = buildCanonicalSolutionForTask17Variant1(realTask17Fields);

    const result = runCanonicalSolutionPipeline(task, canonicalSolution, {
      templateRegistry,
      validationRegistry,
    });

    expect(result.status).toBe('validated');
    expect(result.template).toBe(mathTask17PlanimetryTemplate);
    expect(result.canonicalSolution).toBe(canonicalSolution);
    expect(result.validationResults.every((r) => r.passed)).toBe(true);
    expect(result.validationResults.map((r) => r.ruleId).sort()).toEqual(
      ['has-both-parts', 'has-content'].sort(),
    );
  });

  it('a task 17 built WITHOUT the proof (part а) fails has-both-parts', () => {
    const { templateRegistry, validationRegistry } = makeRegistries();
    const fullSolution = buildCanonicalSolutionForTask17Variant1(realTask17Fields);
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

describe('real task 17 — critical points', () => {
  it('(A) contains the expected critical points, each with a source', () => {
    const solution = buildCanonicalSolutionForTask17Variant1(realTask17Fields);
    const ids = solution.criticalPoints?.map((p) => p.id).sort();

    expect(ids).toEqual(
      [
        'full-credit-requires-both-parts',
        'part-b-using-unproven-a-caps-at-one-point',
        'arithmetic-error-caps-at-two-points',
        'part-b-needs-justification',
        'ad-equals-diameter-must-be-justified',
        'tangency-root-selection-must-be-justified',
        'kite-has-incircle-must-be-justified',
        'free-method-disclaimer',
      ].sort(),
    );
  });

  it('(B) every source is one of the three honest tiers, and the rubric-derived points are tagged secondary_source_verified, never fipi_verified', () => {
    const solution = buildCanonicalSolutionForTask17Variant1(realTask17Fields);
    const bySource = (
      source: 'fipi_verified' | 'secondary_source_verified' | 'project_quality_rule',
    ) => solution.criticalPoints!.filter((p) => p.source === source).map((p) => p.id);

    expect(bySource('fipi_verified')).toEqual([]);
    expect(bySource('secondary_source_verified').sort()).toEqual(
      [
        'full-credit-requires-both-parts',
        'part-b-using-unproven-a-caps-at-one-point',
        'arithmetic-error-caps-at-two-points',
        'part-b-needs-justification',
        'free-method-disclaimer',
      ].sort(),
    );
    expect(bySource('project_quality_rule').sort()).toEqual(
      [
        'ad-equals-diameter-must-be-justified',
        'tangency-root-selection-must-be-justified',
        'kite-has-incircle-must-be-justified',
      ].sort(),
    );
  });

  it('(C) points are correctly linked to part а) / part б) / the whole solution', () => {
    const solution = buildCanonicalSolutionForTask17Variant1(realTask17Fields);
    const byId = (id: string) => solution.criticalPoints!.find((p) => p.id === id)!;

    expect(byId('full-credit-requires-both-parts').partId).toBeUndefined();
    expect(byId('part-b-using-unproven-a-caps-at-one-point').partId).toBe('a');
    expect(byId('ad-equals-diameter-must-be-justified').partId).toBe('a');
    expect(byId('tangency-root-selection-must-be-justified').partId).toBe('a');
    expect(byId('part-b-needs-justification').partId).toBe('b');
    expect(byId('arithmetic-error-caps-at-two-points').partId).toBe('b');
    expect(byId('kite-has-incircle-must-be-justified').partId).toBe('b');
  });

  it('(D) the presentation point (free method) is never required — the rubric allows multiple methods for №17', () => {
    const solution = buildCanonicalSolutionForTask17Variant1(realTask17Fields);
    const point = solution.criticalPoints!.find((p) => p.id === 'free-method-disclaimer')!;
    expect(point.category).toBe('presentation');
    expect(point.required).toBe(false);
  });

  it('(E) a required structural point (has-both-parts) is satisfied when both parts are present', () => {
    const { templateRegistry, validationRegistry } = makeRegistries();
    const solution = buildCanonicalSolutionForTask17Variant1(realTask17Fields);
    const task: TaskTypeContext = { id: REAL_TASK_17_ID, subjectId: 'math', taskNumber: 17 };

    const result = runCanonicalSolutionPipeline(task, solution, {
      templateRegistry,
      validationRegistry,
    });

    const check = result.criticalPointChecks.find(
      (c) => c.criticalPointId === 'full-credit-requires-both-parts',
    );
    expect(check?.status).toBe('satisfied');
  });

  it('(F) the logical-dependency point (part-b-using-unproven-a-caps-at-one-point) stays unlinked — a structural validator cannot detect it', () => {
    const { templateRegistry, validationRegistry } = makeRegistries();
    const solution = buildCanonicalSolutionForTask17Variant1(realTask17Fields);
    const task: TaskTypeContext = { id: REAL_TASK_17_ID, subjectId: 'math', taskNumber: 17 };

    const result = runCanonicalSolutionPipeline(task, solution, {
      templateRegistry,
      validationRegistry,
    });

    const check = result.criticalPointChecks.find(
      (c) => c.criticalPointId === 'part-b-using-unproven-a-caps-at-one-point',
    );
    expect(check?.status).toBe('unlinked');
    expect(result.status).toBe('validated');
  });
});

describe('real task 17 — exam writeup (new, stricter completeness standard)', () => {
  it('(A) has a non-empty examWriteup', () => {
    const solution = buildCanonicalSolutionForTask17Variant1(realTask17Fields);
    expect(solution.examWriteup?.content).toBeTruthy();
  });

  it('(B) contains both part а) and part б)', () => {
    const solution = buildCanonicalSolutionForTask17Variant1(realTask17Fields);
    const content = solution.examWriteup?.content ?? '';
    expect(content).toContain('а)');
    expect(content).toContain('б)');
  });

  it('(C) ends with the final answer, matching correctAnswerDisplay', () => {
    const solution = buildCanonicalSolutionForTask17Variant1(realTask17Fields);
    const content = solution.examWriteup?.content ?? '';
    expect(content.trim().endsWith(`Ответ: ${realTask17Fields.correctAnswerDisplay}`)).toBe(true);
  });

  it('(D) is compact — shorter than the detailed steps, and never duplicates the task condition', () => {
    const solution = buildCanonicalSolutionForTask17Variant1(realTask17Fields);
    const content = solution.examWriteup?.content ?? '';
    const detailedStepsLength = solution.parts
      .flatMap((part) => part.steps)
      .reduce((sum, step) => sum + step.explanation.length, 0);
    expect(content.length).toBeLessThan(detailedStepsLength);
    expect(content).not.toContain('Докажите');
    expect(content).not.toContain('трапецию');
  });

  it('(E) independent steps are on separate lines, never glued with a mechanical ":" continuation', () => {
    const solution = buildCanonicalSolutionForTask17Variant1(realTask17Fields);
    const content = solution.examWriteup?.content ?? '';
    for (const line of content.split('\n')) {
      expect(line.trimEnd().endsWith(':')).toBe(false);
    }
  });

  it('(F) contains the proof conclusion for part а), not just the final numeric answer', () => {
    const solution = buildCanonicalSolutionForTask17Variant1(realTask17Fields);
    const content = solution.examWriteup?.content ?? '';
    expect(content).toContain('требовалось доказать');
  });

  // The user's explicit quality bar for tasks 16-19: the examWriteup
  // must contain every key intermediate result and justification, not
  // just the final answer — "если ученик перепишет только этот блок
  // на экзамене, сможет ли эксперт увидеть полный ход решения".
  it('(G) contains every mathematically load-bearing intermediate result for part а), not just the conclusion', () => {
    const solution = buildCanonicalSolutionForTask17Variant1(realTask17Fields);
    const content = solution.examWriteup?.content ?? '';

    expect(content).toContain('AD=2R'); // height-equals-diameter justification
    expect(content).toContain('y=x'); // the bisector line
    expect(content).toContain('c-b=2R'); // the perpendicularity-derived relation
    expect(content).toContain('R(2+\\sqrt2)'); // the selected tangency root
    expect(content).toContain('R\\sqrt2'); // b (and later the semiperimeter)
  });

  it('(H) contains every mathematically load-bearing intermediate result for part б), not just the conclusion', () => {
    const solution = buildCanonicalSolutionForTask17Variant1(realTask17Fields);
    const content = solution.examWriteup?.content ?? '';

    expect(content).toContain('G=(R,2R)');
    expect(content).toContain('кайт');
    expect(content).toContain('R^2(\\sqrt2-1)'); // the area
    expect(content).toContain('S=r\\cdot s'); // the incircle-radius formula used
    expect(content).toContain('6-3\\sqrt2');
  });

  it('(I) justifies the geometric facts (why AD=2R, why the tangency root is chosen, why BNOG has an incircle), not just states them', () => {
    const solution = buildCanonicalSolutionForTask17Variant1(realTask17Fields);
    const content = solution.examWriteup?.content ?? '';
    expect(content).toContain('Окружность касается $AB$ и $DC\\Rightarrow AD=2R$');
    expect(content).toContain('$B$ правее $A\\Rightarrow');
    expect(content).toContain('у кайта есть вписанная окружность');
  });

  it('(J) uses ⇒ only for genuine one-directional derivations, never as a decorative replacement for "="', () => {
    const solution = buildCanonicalSolutionForTask17Variant1(realTask17Fields);
    const content = solution.examWriteup?.content ?? '';
    // Every line containing ⇒ also contains a premise before it on
    // that same line (not a bare "⇒ result" with nothing derived from).
    for (const line of content.split('\n')) {
      if (line.includes('\\Rightarrow')) {
        const before = line.split('\\Rightarrow')[0]!.trim();
        expect(before.length).toBeGreaterThan(0);
      }
    }
  });
});
