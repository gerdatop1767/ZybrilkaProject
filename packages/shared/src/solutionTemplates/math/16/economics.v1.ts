/**
 * Production template foundation for EGE math task №16 ("экономическая
 * задача" — credit/deposit/optimization problems). Single-part, like
 * №15 — this task's condition has no а)/б) split.
 *
 * Source: max score (2 points, same scale as №13/№15, distinct from
 * №14's 3) and the scoring tiers below confirmed via a reputable
 * secondary aggregator of FIPI's criteria (doc.fipi.ru/4ege.ru were
 * not directly reachable from this session — same network limitation
 * noted in equation.v1.ts/stereometry.v1.ts/inequality.v1.ts). See
 * `realTask16Variant1.ts`'s own doc comment for the exact rubric text.
 *
 * The rubric explicitly requires (unlike №13-15's templates) that
 * variables be defined and the model's construction be justified —
 * not just that a correct equation/inequality appears from nowhere.
 * `variables_defined`/`model_justified` below are this task-category's
 * genuine structural requirements, not copied from any other task's
 * template.
 *
 * Deliberately NOT included yet (would be inventing requirements
 * beyond the single real №16 example this project has fully read):
 *   - credit/deposit/optimization-subtype-specific validators — this
 *     task is a credit problem with an interest-only phase followed
 *     by two equal payments, but that's this task's content, not a
 *     property of "№16 as a category" (deposits and optimization
 *     problems have a completely different model shape).
 */
import {
  defaultSolutionTemplateRegistry,
  type SolutionTemplateRegistry,
  type SolutionTemplate,
} from '../../../solutionEngine/index.js';

export const mathTask16EconomicsTemplate: SolutionTemplate = {
  id: 'math.16.economics',
  version: '1.0.0',
  taskTypeKey: 'math:16',
  requiredElements: ['variables_defined', 'model_justified', 'mathematically_justified_solution'],
  optionalElements: [],
  solutionStructure: { order: ['main'] },
  validationRules: [
    { id: 'has-content', type: 'non-empty-steps' },
    {
      id: 'has-model-setup-step',
      type: 'required-step-kinds-present',
      config: { requiredKinds: ['model_setup'] },
    },
  ],
  examPresentationRules: {
    requiredVisibleElements: ['justification_present', 'variables_defined'],
  },
};

/**
 * Explicit opt-in — never registers as a side effect of importing this
 * module (same pattern as the other `registerMathTaskNNTemplates`).
 */
export function registerMathTask16Templates(
  registry: SolutionTemplateRegistry = defaultSolutionTemplateRegistry,
): void {
  registry.register(mathTask16EconomicsTemplate);
}
