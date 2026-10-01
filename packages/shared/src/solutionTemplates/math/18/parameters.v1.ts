/**
 * Production template foundation for EGE math task №18 ("задача с
 * параметром" — an equation/inequality/system with a parameter).
 * Single-part, like №15/№16 — this task's condition has no а)/б)
 * split, just one "find all values of the parameter" question.
 * Method-agnostic on purpose: this template never requires a specific
 * technique (algebraic case analysis, a graphical argument, a
 * substitution) — only that the domain/parameter range is stated, the
 * critical values are actually derived (not just asserted), and every
 * case the parameter can fall into is covered.
 *
 * Source: scoring-scale structure (0-4 points, distinct from every
 * other task's scale so far — №13/№16 are 0-2, №14/№17 are 0-3)
 * confirmed via a reputable secondary aggregator of FIPI's criteria
 * (doc.fipi.ru itself was not directly reachable from this session —
 * same network limitation noted in every earlier template). See
 * `realTask18Variant1.ts` for the full source breakdown.
 *
 * Deliberately NOT included yet (would be inventing requirements
 * beyond the single real №18 example this project has fully read):
 *   - equation/inequality/system-specific validators — this task is a
 *     system of two equations, but that's this task's content, not a
 *     property of "№18 as a category" (a plain equation or inequality
 *     with a parameter has a different shape);
 *   - graphical-method-specific requirements — an algebraic case
 *     analysis is equally valid, and this template never mandates
 *     a graph.
 */
import {
  defaultSolutionTemplateRegistry,
  type SolutionTemplateRegistry,
  type SolutionTemplate,
} from '../../../solutionEngine/index.js';

export const mathTask18ParametersTemplate: SolutionTemplate = {
  id: 'math.18.parameters',
  version: '1.0.0',
  taskTypeKey: 'math:18',
  requiredElements: [
    'parameter_and_variable_distinguished',
    'domain_stated',
    'critical_values_derived',
    'all_cases_covered',
    'mathematically_justified_solution',
  ],
  optionalElements: [],
  solutionStructure: { order: ['main'] },
  validationRules: [
    { id: 'has-content', type: 'non-empty-steps' },
    {
      id: 'has-domain-step',
      type: 'required-step-kinds-present',
      config: { requiredKinds: ['domain_check'] },
    },
    {
      id: 'has-critical-value-step',
      type: 'required-step-kinds-present',
      config: { requiredKinds: ['critical_value_derivation'] },
    },
  ],
  examPresentationRules: {
    requiredVisibleElements: ['justification_present', 'boundary_values_explained'],
  },
};

/**
 * Explicit opt-in — never registers as a side effect of importing this
 * module (same pattern as the other `registerMathTaskNNTemplates`).
 */
export function registerMathTask18Templates(
  registry: SolutionTemplateRegistry = defaultSolutionTemplateRegistry,
): void {
  registry.register(mathTask18ParametersTemplate);
}
