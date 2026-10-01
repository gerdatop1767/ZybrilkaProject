/**
 * Production template foundation for EGE math task №19 ("числа и их
 * свойства" — a three-part number-theory problem: а) a yes/no
 * question, б) find a minimum, в) find a maximum, all about the same
 * underlying integer relationship). Three real parts (а/б/в), unlike
 * №13/№14/№17's two (а/б) — this task's condition genuinely has three
 * independently-gradable sub-questions, confirmed from the real
 * condition and the DB's own `multi_part` answerType (3 sub-answers),
 * not invented.
 *
 * Source: scoring-scale structure (0-4 points, 1 point per
 * independently-justified component — а, б, в's "bound", в's
 * "example" — up to 4 total) confirmed via a reputable secondary
 * aggregator of FIPI's criteria (doc.fipi.ru itself was not directly
 * reachable from this session — same network limitation noted in
 * every earlier template). See `realTask19Variant1.ts` for the full
 * source breakdown.
 *
 * Deliberately NOT included yet (would be inventing requirements
 * beyond the single real №19 example this project has fully read):
 *   - divisibility/counting/optimization-subtype-specific validators
 *     — this task is a divisibility + bounded-search problem, but
 *     that's this task's content, not a property of "№19 as a
 *     category" (other number-theory subtypes — pure divisibility,
 *     digit problems, Diophantine equations — have a different shape);
 *   - a specific proof method — a bounding argument is used here, but
 *     a template never mandates one proof technique over another.
 */
import {
  defaultSolutionTemplateRegistry,
  type SolutionTemplateRegistry,
  type SolutionTemplate,
} from '../../../solutionEngine/index.js';

export const mathTask19NumberTheoryTemplate: SolutionTemplate = {
  id: 'math.19.number-theory',
  version: '1.0.0',
  taskTypeKey: 'math:19',
  requiredElements: [
    'part_a_present',
    'part_b_present',
    'part_c_present',
    'mathematically_justified_solution',
  ],
  optionalElements: [],
  solutionStructure: { order: ['a', 'b', 'c'] },
  validationRules: [
    {
      id: 'has-all-parts',
      type: 'required-parts-present',
      config: { requiredPartIds: ['a', 'b', 'c'] },
    },
    { id: 'has-content', type: 'non-empty-steps' },
    {
      id: 'has-bound-derivation-step',
      type: 'required-step-kinds-present',
      config: { requiredKinds: ['bound_derivation'] },
    },
    {
      id: 'has-exhaustive-case-check-step',
      type: 'required-step-kinds-present',
      config: { requiredKinds: ['exhaustive_case_check'] },
    },
  ],
  examPresentationRules: {
    requiredVisibleElements: ['justification_present', 'bound_and_example_both_shown'],
  },
};

/**
 * Explicit opt-in — never registers as a side effect of importing this
 * module (same pattern as the other `registerMathTaskNNTemplates`).
 */
export function registerMathTask19Templates(
  registry: SolutionTemplateRegistry = defaultSolutionTemplateRegistry,
): void {
  registry.register(mathTask19NumberTheoryTemplate);
}
