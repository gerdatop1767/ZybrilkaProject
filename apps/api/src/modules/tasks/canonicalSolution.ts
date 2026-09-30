/**
 * API-layer integration boundary: DB Task row → CanonicalSolution DTO.
 * This is the ONLY place in the API that knows `solutionEngine`/
 * `solutionTemplates` exist — `packages/db`/Drizzle never imports
 * them, and `solutionEngine` never imports API/DB types. This module
 * is the seam between the two, exactly per the approved architecture:
 *
 *   DB Task row → (this module) → CanonicalSolution DTO → TaskWithSolution
 *
 * Which task rows get a canonical solution is decided by the row's own
 * `contentHash` — a real, already-existing, unique DB column (dedup
 * fingerprint, `packages/db/src/importEge2026Variant1.ts`'s
 * `contentHashFor`), NOT by `taskNumber`. A `taskNumber`-based check
 * would silently misattribute this one task's canonical steps to any
 * *other* task that happens to share number 13 the moment a second one
 * is imported; content-hash matching can't do that — it only ever
 * matches the exact task this content was authored for.
 */
import {
  solutionEngine,
  solutionTemplates,
  toCanonicalSolutionDto,
  type CanonicalSolutionDto,
} from '@zybrilka/shared';

// Explicit opt-in registration, once, at module load — solutionTemplates
// never auto-registers on import (see equation.v1.ts's own doc comment).
solutionTemplates.registerMathTask13Templates();

/**
 * sha256('math|13|' + normalized rawStatement), computed offline from
 * the real task's own text in `importEge2026Variant1.ts` (taskNumber:
 * 13, "а) Решите уравнение √(2cos³x − sin²x − 2cosx − sinx) =
 * √(cos(π/2+x)). б) Найдите все корни этого уравнения, принадлежащие
 * отрезку [−4π; −5π/2].") using that file's own `contentHashFor`
 * normalization (trim + lowercase + collapse whitespace) — reproduced
 * here as a literal constant rather than importing that script's
 * private helper (it isn't exported, and doesn't need to be for one
 * known value). If this task's wording is ever edited, its
 * `content_hash` changes too, and this constant must be updated to
 * match — a stale value simply stops matching (falls back to no
 * canonical solution), it never matches the wrong task.
 */
const REAL_TASK_13_VARIANT_1_CONTENT_HASH =
  '5c674d67f90cd1a4b2bfc9bd6cdd47ec823d5463f73e0f6f58cd88921b9a5cab';

export interface CanonicalSolutionTaskInput {
  readonly id: string;
  readonly subjectId: string;
  readonly taskNumber: number;
  readonly contentHash: string | null;
  readonly correctAnswer: string;
  readonly correctAnswerDisplay: string | null;
}

/**
 * Returns the DTO for `task`, or `undefined` when this task has no
 * authored canonical-solution content — always safe to spread into a
 * `TaskWithSolution` response; never throws for a task that simply
 * isn't covered yet.
 */
export function getCanonicalSolutionForTask(
  task: CanonicalSolutionTaskInput,
): CanonicalSolutionDto | undefined {
  if (task.contentHash !== REAL_TASK_13_VARIANT_1_CONTENT_HASH) return undefined;

  const canonicalSolution = solutionTemplates.buildCanonicalSolutionForTask13Variant1({
    taskId: task.id,
    correctAnswer: task.correctAnswer,
    correctAnswerDisplay: task.correctAnswerDisplay,
  });

  const result = solutionEngine.runCanonicalSolutionPipeline(
    { id: task.id, subjectId: task.subjectId, taskNumber: task.taskNumber },
    canonicalSolution,
  );

  return toCanonicalSolutionDto(result);
}
