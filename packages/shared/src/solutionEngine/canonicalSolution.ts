/**
 * Small helpers around `CanonicalSolution`. Kept separate from
 * `types.ts` because these are runtime functions, not type
 * declarations.
 */
import type { CanonicalSolution, SolutionStep } from './types.js';

/**
 * Every step across every part, in part order — the one canonical
 * path a learner should actually be shown. `CanonicalSolution.
 * alternativeSolutions` is an architectural placeholder only (see
 * `types.ts`); this function deliberately never reads it, so "only one
 * path is active" is enforced by code, not just documentation, for as
 * long as this foundation stands.
 */
export function getPrimarySteps(solution: CanonicalSolution): readonly SolutionStep[] {
  return solution.parts.flatMap((part) => part.steps);
}
