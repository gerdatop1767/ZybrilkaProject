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
 * would silently misattribute one task's canonical steps to any
 * *other* task that happens to share the same number the moment a
 * second one is imported; content-hash matching can't do that — it
 * only ever matches the exact task each entry's content was authored
 * for. `CONTENT_BUILDERS` below is a lookup by that hash, not a
 * `taskNumber`/`if` chain — adding a task is adding one entry, never a
 * branch in this function's own logic.
 */
import {
  solutionEngine,
  solutionTemplates,
  toCanonicalSolutionDto,
  type CanonicalSolutionDto,
} from '@zybrilka/shared';

type CanonicalSolution = ReturnType<
  typeof solutionTemplates.buildCanonicalSolutionForTask13Variant1
>;

// Explicit opt-in registration, once, at module load — solutionTemplates
// never auto-registers on import (see equation.v1.ts's own doc comment).
solutionTemplates.registerMathTask13Templates();
solutionTemplates.registerMathTask14Templates();
solutionTemplates.registerMathTask15Templates();

interface ContentFields {
  readonly taskId: string;
  readonly correctAnswer: string;
  readonly correctAnswerDisplay: string | null;
}

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

/**
 * sha256('math|14|' + normalized rawStatement), same derivation as
 * above, for the real task's text (taskNumber: 14, "В пирамиде SABCD
 * с высотой SA основанием является квадрат ABCD, точка K — середина
 * ребра SB. ... а) Докажите, что прямая a ... делит диагональ
 * основания AC в отношении 1:2. б) Найдите угол между прямыми DK и
 * SC, если AB=2√3, SA=6.") — verified independently against the
 * DB row's own `content_hash` before this constant was written.
 */
const REAL_TASK_14_VARIANT_1_CONTENT_HASH =
  'd7a4d76a3d9833dbe914bc8cdd9b12615911a4de80f999725f801837be7b366c';

/**
 * sha256('math|15|' + normalized rawStatement), same derivation as
 * above, for the real task's text (taskNumber: 15, "Решите неравенство
 * (9^x − 3^(x+2) + 8) / (log_(1/6)²(5^x−2) + log_(1/6)(5^x−2)² + 1) ≤
 * 0.") — verified independently against the DB row's own
 * `content_hash` before this constant was written.
 */
const REAL_TASK_15_VARIANT_1_CONTENT_HASH =
  '97c7af5d295d3a0516d5e517b32f671f45b0e3055d03b2fb39de0d8d9d3017d2';

/** contentHash → content-layer builder. One entry per authored task; never a `taskNumber` branch. */
const CONTENT_BUILDERS: ReadonlyMap<string, (fields: ContentFields) => CanonicalSolution> = new Map(
  [
    [
      REAL_TASK_13_VARIANT_1_CONTENT_HASH,
      solutionTemplates.buildCanonicalSolutionForTask13Variant1,
    ],
    [
      REAL_TASK_14_VARIANT_1_CONTENT_HASH,
      solutionTemplates.buildCanonicalSolutionForTask14Variant1,
    ],
    [
      REAL_TASK_15_VARIANT_1_CONTENT_HASH,
      solutionTemplates.buildCanonicalSolutionForTask15Variant1,
    ],
  ],
);

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
  const buildContent = task.contentHash ? CONTENT_BUILDERS.get(task.contentHash) : undefined;
  if (!buildContent) return undefined;

  const canonicalSolution = buildContent({
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
