/**
 * Cross-references a `CanonicalSolution`'s `criticalPoints` against
 * already-computed `ValidationResult`s — a read-only summary layer,
 * never a second execution path. A critical point's own "is it
 * satisfied" answer is always exactly the pass/fail of the
 * `ValidationRule` it names via `validationRuleId`; this module never
 * re-implements or re-runs a check.
 *
 * This is deliberately the only place that interprets
 * `ExamCriticalPoint.validationRuleId` — so a template's
 * `validationRules` stay the single source of truth for "did this
 * pass", and critical points stay a documentation/traceability layer
 * on top, exactly as the architecture note intends (never letting an
 * informational point silently gate anything).
 */
import type { CanonicalSolution, ValidationResult } from './types.js';

export type CriticalPointCheckStatus =
  'satisfied' | 'not_satisfied' | 'unlinked' | 'unresolvable_rule';

export interface CriticalPointCheck {
  readonly criticalPointId: string;
  readonly status: CriticalPointCheckStatus;
  readonly relatedValidationResult?: ValidationResult;
}

/**
 * - No `validationRuleId` on the point → `'unlinked'` (by design —
 *   most `presentation` points, and any `correctness`/`exam_scoring`
 *   point that isn't structurally automatable without AI/CAS, are
 *   expected to be unlinked; this is not an error).
 * - `validationRuleId` names a rule that never ran (typo, or the rule
 *   was removed from the template) → `'unresolvable_rule'` — degrades
 *   predictably, never throws.
 * - Otherwise → `'satisfied'`/`'not_satisfied'`, mirroring that rule's
 *   own `ValidationResult.passed` exactly.
 */
export function checkCriticalPoints(
  solution: CanonicalSolution,
  validationResults: readonly ValidationResult[],
): readonly CriticalPointCheck[] {
  const points = solution.criticalPoints ?? [];
  return points.map((point) => {
    if (!point.validationRuleId) {
      return { criticalPointId: point.id, status: 'unlinked' };
    }
    const relatedValidationResult = validationResults.find(
      (r) => r.ruleId === point.validationRuleId,
    );
    if (!relatedValidationResult) {
      return { criticalPointId: point.id, status: 'unresolvable_rule' };
    }
    return {
      criticalPointId: point.id,
      status: relatedValidationResult.passed ? 'satisfied' : 'not_satisfied',
      relatedValidationResult,
    };
  });
}
