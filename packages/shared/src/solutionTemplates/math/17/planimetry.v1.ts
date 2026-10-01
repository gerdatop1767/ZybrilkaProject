/**
 * Production template foundation for EGE math task №17 ("планиметрия"
 * — a two-part task: а) prove a geometric fact, б) compute a geometric
 * quantity — same two-part shape as №14's stereometry template, but a
 * genuinely separate template/id, never shared code that branches on
 * taskNumber. Method-agnostic on purpose: this template never requires
 * the coordinate method specifically — a synthetic proof is equally
 * valid — only that а) is actually proven and б) is actually
 * justified.
 *
 * Source: scoring-scale structure (0-3 points, same scale shape as
 * №14 but its own independently-sourced rubric text) confirmed via a
 * reputable secondary aggregator of FIPI's criteria (doc.fipi.ru
 * itself was not directly reachable from this session — same network
 * limitation noted in every earlier template this project built). See
 * `realTask17Variant1.ts` for the full source breakdown and the exact
 * rubric text this template's structural requirements are built from.
 *
 * Deliberately NOT included yet (would be inventing requirements
 * beyond the single real №17 example this project has fully read):
 *   - circle/incircle/kite-specific validators — these depend on this
 *     specific task's content, not a property of "№17 as a category"
 *     (other planimetry subtypes — triangles, similar polygons, angle
 *     chasing — have a completely different shape);
 *   - coordinate-method-specific requirements — a synthetic/classical
 *     proof is an equally valid way to earn full credit.
 */
import {
  defaultSolutionTemplateRegistry,
  type SolutionTemplateRegistry,
  type SolutionTemplate,
} from '../../../solutionEngine/index.js';

export const mathTask17PlanimetryTemplate: SolutionTemplate = {
  id: 'math.17.planimetry',
  version: '1.0.0',
  taskTypeKey: 'math:17',
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
 * module (same pattern as the other `registerMathTaskNNTemplates`).
 */
export function registerMathTask17Templates(
  registry: SolutionTemplateRegistry = defaultSolutionTemplateRegistry,
): void {
  registry.register(mathTask17PlanimetryTemplate);
}
