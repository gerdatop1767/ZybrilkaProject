/**
 * Production template foundation for EGE math task №13 ("уравнение" —
 * trigonometric, logarithmic, or exponential per FIPI-2026 grading
 * methodology, verified fact 1). Deliberately method-agnostic: it
 * covers ANY equation type and ANY solving method for №13, because the
 * structural requirements below hold regardless of method — see
 * verified facts 6-9 below (method and write-up form are free; what's
 * graded is a justified, complete line of reasoning, not matching a
 * reference solution).
 *
 * Source: official FIPI-2026 grading methodology for EGE mathematics
 * experts (doc.fipi.ru/ege/dlya-predmetnyh-komissiy-subektov-rf/2026/matematika_mr_ege_2026.pdf),
 * as relayed and verified by the project owner against the primary
 * document (session record — this project does not have direct network
 * access to doc.fipi.ru to re-verify itself). Facts used here:
 *   - fact 1: task type is trigonometric, logarithmic, or exponential.
 *   - fact 2: the task has parts а) and б).
 *   - fact 3: no answer to part а) → 0 points (part_a_present is
 *     load-bearing, not a UI nicety).
 *   - facts 4-5: full credit requires a justified correct answer in
 *     both parts; partial credit still requires a complete, justified
 *     line of reasoning even with a computational slip.
 *   - facts 6-9: method and write-up form are free — this template
 *     never requires a specific method, and validation only checks
 *     structural presence, never "matches the canonical solution".
 *
 * Deliberately NOT included yet (would require content verified beyond
 * the single real №13 example this project has fully read — adding
 * these now would be exactly the "invent requirements from one
 * example" mistake the project owner ruled out):
 *   - equation-type-specific (trig/log/exp) validators;
 *   - domain/ОДЗ or root-selection-on-interval requirements — these
 *     depend on a specific task's content, not on №13 as a category;
 *   - method tags as required (facts 6-7 forbid mandating a method).
 */
import {
  defaultSolutionTemplateRegistry,
  type SolutionTemplateRegistry,
  type SolutionTemplate,
} from '../../../solutionEngine/index.js';

export const mathTask13EquationTemplate: SolutionTemplate = {
  id: 'math.13.equation',
  version: '1.0.0',
  taskTypeKey: 'math:13',
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
 * module. Nothing in the API/UI calls this yet (no DB/API/UI wiring at
 * this stage); it exists so the template is registry-testable and so a
 * later, explicitly-approved wiring step has a single call to make.
 */
export function registerMathTask13Templates(
  registry: SolutionTemplateRegistry = defaultSolutionTemplateRegistry,
): void {
  registry.register(mathTask13EquationTemplate);
}
