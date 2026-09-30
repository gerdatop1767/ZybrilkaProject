/**
 * The generic `Task → SolutionTemplateContext → CanonicalSolution →
 * validation` orchestration. Subject/task-agnostic, like the rest of
 * this engine — it only ever resolves a template through `subjectId` +
 * `taskNumber` (+ optional `subtypeId`) composed into a `TaskTypeKey`,
 * never branches on a specific number (no `if (taskNumber === 13)`
 * anywhere in this file or in `SolutionTemplateRegistry`).
 *
 * Deliberately NOT wired to any DB/Drizzle type — `TaskTypeContext` is
 * the minimal shape this layer needs, satisfied by a plain object a
 * caller builds from whatever its own Task representation is (a DB
 * row, an API DTO, a test fixture — this module doesn't care).
 *
 * This module does not decide how a `CanonicalSolution` gets built for
 * a given task — that's inherently task-content-specific (see
 * `solutionTemplates/math/13/realTask13Variant1.ts` for why), so a
 * caller passes an already-built one in. What this module DOES own is
 * the generic "resolve the template, then validate" sequencing, so
 * that sequencing itself is never duplicated per subject/task.
 */
import type {
  CanonicalSolution,
  SolutionTemplate,
  TaskTypeKey,
  ValidationContext,
  ValidationResult,
} from './types.js';
import {
  defaultSolutionTemplateRegistry,
  type SolutionTemplateRegistry,
} from './templateRegistry.js';
import {
  defaultValidationRuleRegistry,
  type ValidationRuleRegistry,
} from './validationRegistry.js';
import { runValidation } from './runValidation.js';
import { checkCriticalPoints, type CriticalPointCheck } from './criticalPoints.js';

/** The minimal task shape this layer needs to resolve a template — nothing DB-specific. */
export interface TaskTypeContext {
  readonly id: string;
  readonly subjectId: string;
  readonly taskNumber: number;
}

/** `{subjectId}:{taskNumber}` — the one place this composition happens, so it's never duplicated per call site. */
export function buildTaskTypeKey(task: TaskTypeContext): TaskTypeKey {
  return `${task.subjectId}:${task.taskNumber}`;
}

export type SolutionPipelineStatus = 'no_template' | 'validated' | 'validation_failed';

export interface SolutionPipelineResult {
  readonly template: SolutionTemplate | undefined;
  readonly canonicalSolution: CanonicalSolution | undefined;
  readonly validationResults: readonly ValidationResult[];
  readonly status: SolutionPipelineStatus;
  /**
   * A read-only summary of `canonicalSolution.criticalPoints` against
   * `validationResults` (see `checkCriticalPoints`) — purely
   * descriptive: it never influences `status`, which stays driven
   * solely by `validationResults`, so a critical point can never
   * silently gate anything beyond the structural rule it names.
   */
  readonly criticalPointChecks: readonly CriticalPointCheck[];
}

/**
 * Resolves `task`'s template (returns `status: 'no_template'`,
 * un-thrown, when none is registered for it or `canonicalSolution` is
 * undefined — canonical solutions are optional per task; a task with
 * neither must never disrupt the existing task flow), then runs
 * `runValidation` against it. Never touches `answerChecker`/
 * `attempts`/`mistakes` — this validates the *canonical* solution
 * against its template, not a learner's answer.
 */
export function runCanonicalSolutionPipeline(
  task: TaskTypeContext,
  canonicalSolution: CanonicalSolution | undefined,
  options: {
    readonly subtypeId?: string;
    readonly templateRegistry?: SolutionTemplateRegistry;
    readonly validationRegistry?: ValidationRuleRegistry;
  } = {},
): SolutionPipelineResult {
  const templateRegistry = options.templateRegistry ?? defaultSolutionTemplateRegistry;
  const validationRegistry = options.validationRegistry ?? defaultValidationRuleRegistry;
  const template = templateRegistry.resolve(buildTaskTypeKey(task), options.subtypeId);

  if (!template || !canonicalSolution) {
    return {
      template,
      canonicalSolution: undefined,
      validationResults: [],
      status: 'no_template',
      criticalPointChecks: [],
    };
  }

  const context: ValidationContext = {
    template,
    task: { id: task.id, taskTypeKey: buildTaskTypeKey(task) },
  };
  const validationResults = runValidation(canonicalSolution, template, context, validationRegistry);
  const status: SolutionPipelineStatus = validationResults.every((r) => r.passed)
    ? 'validated'
    : 'validation_failed';
  const criticalPointChecks = checkCriticalPoints(canonicalSolution, validationResults);

  return { template, canonicalSolution, validationResults, status, criticalPointChecks };
}
