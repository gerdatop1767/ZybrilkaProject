/**
 * The validation pipeline entry point. Deliberately offline/authoring-time
 * only (see architecture doc §D) — this is never called from the
 * `POST /tasks/:id/attempt` runtime path, and never touches
 * `attempts`/`mistakes`. It validates a canonical (reference) solution
 * against its own template, not a learner's answer.
 */
import type {
  CanonicalSolution,
  SolutionTemplate,
  ValidationContext,
  ValidationResult,
} from './types.js';
import {
  defaultValidationRuleRegistry,
  type ValidationRuleRegistry,
} from './validationRegistry.js';

/**
 * Runs every `ValidationRule` on `template` against `solution`. An
 * unregistered `rule.type` never throws — it comes back as a failed
 * result naming the unknown type, so a typo'd/future rule type degrades
 * predictably instead of crashing the whole pipeline.
 */
export function runValidation(
  solution: CanonicalSolution,
  template: SolutionTemplate,
  context: ValidationContext,
  registry: ValidationRuleRegistry = defaultValidationRuleRegistry,
): ValidationResult[] {
  return template.validationRules.map((rule) => {
    const validator = registry.get(rule.type);
    if (!validator) {
      return {
        ruleId: rule.id,
        ruleType: rule.type,
        passed: false,
        message: `Unknown validator type: "${rule.type}"`,
      };
    }
    return validator(solution, rule, context);
  });
}
