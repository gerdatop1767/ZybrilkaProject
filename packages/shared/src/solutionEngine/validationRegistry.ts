/**
 * Dispatch table from a declarative `ValidationRule.type` string to its
 * concrete implementation. Keeping this separate from `types.ts` is the
 * point of the "declarative rule, not executable function" design: a
 * `SolutionTemplate` only ever references a `type` string, so templates
 * stay plain data while implementations live and evolve here.
 */
import type {
  CanonicalSolution,
  ValidationContext,
  ValidationRule,
  ValidationResult,
} from './types.js';

export type Validator = (
  solution: CanonicalSolution,
  rule: ValidationRule,
  context: ValidationContext,
) => ValidationResult;

export class ValidationRuleRegistry {
  private readonly validators = new Map<string, Validator>();

  register(type: string, validator: Validator): void {
    this.validators.set(type, validator);
  }

  get(type: string): Validator | undefined {
    return this.validators.get(type);
  }

  has(type: string): boolean {
    return this.validators.has(type);
  }
}

/**
 * The registry actually used by `runValidation`'s default parameter.
 * Subject-specific validators (math-, language-specific — none exist
 * yet) register themselves into this instance, or tests can construct
 * their own isolated `ValidationRuleRegistry` instead.
 */
export const defaultValidationRuleRegistry = new ValidationRuleRegistry();
