/**
 * Production template foundation for EGE math task №15 ("неравенство"
 * — a single-part task: solve a rational/logarithmic/exponential
 * inequality). Structurally distinct from №13 (two parts, equation)
 * and №14 (two parts, proof + computation): one part, no
 * "has-both-parts" requirement, but a genuine domain (ОДЗ) structural
 * requirement that №13/№14 never needed.
 *
 * Source: max score (2 points, distinct from №14's 3 and №13's 2-but-
 * different-rubric) and the scoring tiers below confirmed via a
 * reputable secondary aggregator of FIPI's criteria (doc.fipi.ru/
 * 4ege.ru were not directly reachable from this session — same
 * network limitation noted in equation.v1.ts/stereometry.v1.ts). See
 * `realTask15Variant1.ts`'s own doc comment for the exact rubric text.
 *
 * Deliberately NOT included yet (would be inventing requirements
 * beyond the single real №15 example this project has fully read):
 *   - inequality-subtype-specific (purely logarithmic / purely
 *     exponential / purely rational) validators — this task mixes
 *     exponential (numerator) and logarithmic (denominator)
 *     structure, but that combination is this task's content, not a
 *     property of "№15 as a category";
 *   - a required "excluded point" structural element — whether a task
 *     even HAS an excluded point is itself task-specific content, not
 *     something true of every №15.
 */
import {
  defaultSolutionTemplateRegistry,
  type SolutionTemplateRegistry,
  type SolutionTemplate,
} from '../../../solutionEngine/index.js';

export const mathTask15InequalityTemplate: SolutionTemplate = {
  id: 'math.15.inequality',
  version: '1.0.0',
  taskTypeKey: 'math:15',
  requiredElements: ['domain_present', 'mathematically_justified_solution'],
  optionalElements: [],
  solutionStructure: { order: ['main'] },
  validationRules: [
    { id: 'has-content', type: 'non-empty-steps' },
    {
      id: 'has-domain-step',
      type: 'required-step-kinds-present',
      config: { requiredKinds: ['domain_check'] },
    },
  ],
  examPresentationRules: {
    requiredVisibleElements: ['justification_present', 'domain_present'],
  },
};

/**
 * Explicit opt-in — never registers as a side effect of importing this
 * module (same pattern as `registerMathTask13Templates`/`...14...`).
 */
export function registerMathTask15Templates(
  registry: SolutionTemplateRegistry = defaultSolutionTemplateRegistry,
): void {
  registry.register(mathTask15InequalityTemplate);
}
