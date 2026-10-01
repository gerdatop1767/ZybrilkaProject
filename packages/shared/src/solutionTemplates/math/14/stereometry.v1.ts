/**
 * Production template foundation for EGE math task №14 ("стереометрия"
 * — a two-part task: а) prove a geometric fact, б) compute a geometric
 * quantity — per the scoring rubric confirmed for this task, see
 * `realTask14Variant1.ts`'s own doc comment for sourcing). Method-
 * agnostic on purpose: this template never requires the coordinate
 * method specifically — a synthetic/vector proof is equally valid —
 * only that а) is actually proven and б) is actually justified.
 *
 * Source: scoring-scale structure (0-3 points, distinct from №13's
 * 0-2) confirmed via a reputable secondary aggregator of FIPI's
 * criteria (doc.fipi.ru itself was not directly reachable from this
 * session — same network limitation noted in equation.v1.ts). See
 * `realTask14Variant1.ts` for the full source breakdown and the exact
 * rubric text this template's structural requirements are built from.
 *
 * Deliberately NOT included yet (would be inventing requirements
 * beyond the single real №14 example this project has fully read):
 *   - topic-specific (pyramid/prism/angle-between-lines/dihedral-angle)
 *     validators — these depend on a specific task's content;
 *   - coordinate-method-specific requirements — facts 6-9's style
 *     "method is free" principle (carried over from №13's general
 *     FIPI grading philosophy, not re-verified per-task here) forbids
 *     mandating one.
 */
import {
  defaultSolutionTemplateRegistry,
  type SolutionTemplateRegistry,
  type SolutionTemplate,
} from '../../../solutionEngine/index.js';

export const mathTask14StereometryTemplate: SolutionTemplate = {
  id: 'math.14.stereometry',
  version: '1.0.0',
  taskTypeKey: 'math:14',
  requiredElements: ['part_a_present', 'part_b_present', 'mathematically_justified_solution'],
  optionalElements: [],
  solutionStructure: { order: ['a', 'b'] },
  validationRules: [
    {
      id: 'has-both-parts',
      type: 'required-parts-present',
      config: { requiredPartIds: ['a', 'b'] },
    },
    { id: 'has-content', type: 'non-empty-steps' },
  ],
  examPresentationRules: {
    requiredVisibleElements: ['justification_present'],
  },
};

/**
 * Explicit opt-in — never registers as a side effect of importing this
 * module (same pattern as `registerMathTask13Templates`).
 */
export function registerMathTask14Templates(
  registry: SolutionTemplateRegistry = defaultSolutionTemplateRegistry,
): void {
  registry.register(mathTask14StereometryTemplate);
}
