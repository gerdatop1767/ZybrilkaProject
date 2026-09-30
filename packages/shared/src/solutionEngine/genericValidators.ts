/**
 * Generic, subject-agnostic validators — foundation only. These treat
 * `SolutionStep.kind`/`PartSolution.id` as opaque strings (never
 * interpreting what a kind like "domain_check" or a part id like "a"
 * means), so they stay valid for any future subject/task template.
 * Real math-specific validators (root correctness, domain-restriction
 * checks, etc.) are a later stage and belong in their own module, not
 * here.
 */
import type { CanonicalSolution, ValidationRule, ValidationResult } from './types.js';
import { getPrimarySteps } from './canonicalSolution.js';
import {
  defaultValidationRuleRegistry,
  type ValidationRuleRegistry,
} from './validationRegistry.js';

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

/** rule.config.requiredKinds: string[] — every kind must appear on at least one step, across all parts. */
function requiredStepKindsPresent(
  solution: CanonicalSolution,
  rule: ValidationRule,
): ValidationResult {
  const requiredKinds = isStringArray(rule.config?.requiredKinds) ? rule.config.requiredKinds : [];
  const presentKinds = new Set(
    getPrimarySteps(solution)
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

/** No config — fails when a CanonicalSolution has no steps in any part. */
function nonEmptySteps(solution: CanonicalSolution, rule: ValidationRule): ValidationResult {
  const passed = getPrimarySteps(solution).length > 0;
  return {
    ruleId: rule.id,
    ruleType: rule.type,
    passed,
    message: passed ? undefined : 'CanonicalSolution has no steps',
  };
}

/**
 * rule.config.requiredPartIds: string[] — every id must be present in
 * `solution.parts`. Subject-agnostic: doesn't know "a"/"b" mean
 * anything beyond opaque identifiers a template chose.
 */
function requiredPartsPresent(solution: CanonicalSolution, rule: ValidationRule): ValidationResult {
  const requiredPartIds = isStringArray(rule.config?.requiredPartIds)
    ? rule.config.requiredPartIds
    : [];
  const presentIds = new Set(solution.parts.map((part) => part.id));
  const missing = requiredPartIds.filter((id) => !presentIds.has(id));
  return {
    ruleId: rule.id,
    ruleType: rule.type,
    passed: missing.length === 0,
    message: missing.length > 0 ? `Missing required part(s): ${missing.join(', ')}` : undefined,
  };
}

/** Call once to make the generic validators available on a registry (default: the shared default registry). */
export function registerGenericValidators(
  registry: ValidationRuleRegistry = defaultValidationRuleRegistry,
): void {
  registry.register('required-step-kinds-present', requiredStepKindsPresent);
  registry.register('non-empty-steps', nonEmptySteps);
  registry.register('required-parts-present', requiredPartsPresent);
}
