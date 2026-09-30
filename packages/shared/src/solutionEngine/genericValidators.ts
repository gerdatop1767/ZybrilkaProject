/**
 * Generic, subject-agnostic validators — foundation only. These treat
 * `SolutionStep.kind` as an opaque string (never interpreting what a
 * kind like "domain_check" means), so they stay valid for any future
 * subject/task template. Real math-specific validators (root
 * correctness, domain-restriction checks, etc.) are a later stage and
 * belong in their own module, not here.
 */
import type { CanonicalSolution, ValidationRule, ValidationResult } from './types.js';
import {
  defaultValidationRuleRegistry,
  type ValidationRuleRegistry,
} from './validationRegistry.js';

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

/** rule.config.requiredKinds: string[] — every kind must appear on at least one step. */
function requiredStepKindsPresent(
  solution: CanonicalSolution,
  rule: ValidationRule,
): ValidationResult {
  const requiredKinds = isStringArray(rule.config?.requiredKinds) ? rule.config.requiredKinds : [];
  const presentKinds = new Set(
    solution.steps
      .map((step) => step.kind)
      .filter((kind): kind is string => typeof kind === 'string'),
  );
  const missing = requiredKinds.filter((kind) => !presentKinds.has(kind));
  return {
    ruleId: rule.id,
    ruleType: rule.type,
    passed: missing.length === 0,
    message:
      missing.length > 0 ? `Missing required step kind(s): ${missing.join(', ')}` : undefined,
  };
}

/** No config — fails when a CanonicalSolution has an empty step list. */
function nonEmptySteps(solution: CanonicalSolution, rule: ValidationRule): ValidationResult {
  const passed = solution.steps.length > 0;
  return {
    ruleId: rule.id,
    ruleType: rule.type,
    passed,
    message: passed ? undefined : 'CanonicalSolution has no steps',
  };
}

/** Call once to make the generic validators available on a registry (default: the shared default registry). */
export function registerGenericValidators(
  registry: ValidationRuleRegistry = defaultValidationRuleRegistry,
): void {
  registry.register('required-step-kinds-present', requiredStepKindsPresent);
  registry.register('non-empty-steps', nonEmptySteps);
}
