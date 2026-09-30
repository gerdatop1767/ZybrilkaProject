/**
 * Global Solution Engine — public surface of the foundation layer.
 * Exported from `@zybrilka/shared` as a namespace (`solutionEngine`),
 * not flattened into the package's top-level exports, so it can never
 * collide with the existing `SolutionStep` on `tasks.ts` (a deliberate
 * separation, not an oversight — the two are unrelated types serving
 * different layers, see the architecture doc).
 */
export * from './types.js';
export {
  ValidationRuleRegistry,
  defaultValidationRuleRegistry,
  type Validator,
} from './validationRegistry.js';
export { registerGenericValidators } from './genericValidators.js';
export { runValidation } from './runValidation.js';
export { SolutionTemplateRegistry, defaultSolutionTemplateRegistry } from './templateRegistry.js';
export { getPrimarySteps } from './canonicalSolution.js';

import { registerGenericValidators } from './genericValidators.js';

// Foundation-level generic validators are available on the default
// registry as soon as the engine is imported — subject-specific
// validators (none exist yet) register themselves the same way from
// their own module.
registerGenericValidators();
