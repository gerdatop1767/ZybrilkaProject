/**
 * Global Solution Engine — foundation types (Canonical Solution System).
 *
 * Subject/task-agnostic by design: this module must never gain a math-,
 * language-, or task-number-specific concept (no `TrigEquation...`, no
 * `hasOdz`, no `geometry`/`parameter` enums, no hardcoded task numbers).
 * Concrete rules for one subject/task/subtype belong in
 * `packages/shared/src/solutionTemplates/**` (a later stage, not yet
 * created) and get registered into `SolutionTemplateRegistry` — never
 * hardcoded here.
 *
 * This is a foundation layer only: no DB columns, no API wiring, no UI
 * changes, and no math-specific validators exist yet. It's a parallel,
 * opt-in subsystem — the existing `SolutionStep`/`solutionSteps` on
 * `tasks.ts` (and everything else on `TaskWithSolution`) is untouched.
 */

/** Namespaced "what kind of task is this" key, e.g. "math:13", "rus:27". Free-form by design — the engine never parses or enumerates it. */
export type TaskTypeKey = string;

/**
 * One step of a canonical solution. `kind` is an open string tag (e.g.
 * "domain_check", "equivalent_transition") whose vocabulary is defined
 * entirely by a `SolutionTemplate` for a specific subject/task — the
 * engine only ever compares `kind` values as opaque strings, never
 * interprets them.
 */
export interface SolutionStep {
  readonly id: string;
  readonly title: string;
  readonly explanation: string;
  readonly kind?: string;
  readonly requiredForCredit?: boolean;
  readonly partId?: string;
}

/** Compact, exam-ready write-up — same math-markup convention as everything else (see MathText). */
export interface ExamWriteup {
  readonly content: string;
}

/** One short "what matters for the exam" point. */
export interface ExamCriticalPoint {
  readonly text: string;
  readonly relatesToRule?: string;
}

/**
 * The concrete solution content for one specific task. Exactly one
 * `steps` sequence is the canonical/primary path at this stage.
 * `alternativeSolutions` is a forward-looking architectural placeholder
 * only (approved architecture doc, "K. Минимальный vertical slice") —
 * no code in this foundation reads or validates it, and it must not be
 * populated yet.
 */
export interface CanonicalSolution {
  readonly taskId: string;
  readonly templateId: string;
  readonly templateVersion: string;
  readonly steps: readonly SolutionStep[];
  readonly examWriteup?: ExamWriteup;
  readonly criticalPoints?: readonly ExamCriticalPoint[];
  /** Architectural placeholder for future method A/B/C support — not implemented; must stay unpopulated for now. */
  readonly alternativeSolutions?: readonly (readonly SolutionStep[])[];
}

/**
 * A declarative validation rule. `type` selects an implementation
 * registered in a `ValidationRuleRegistry` — this interface never
 * carries executable code, so templates stay pure data (serializable,
 * reviewable, diffable in git) and validator implementations can be
 * added/changed without touching any template that references them.
 */
export interface ValidationRule {
  readonly id: string;
  readonly type: string;
  readonly config?: Readonly<Record<string, unknown>>;
  readonly description?: string;
}

export interface ValidationContext {
  readonly template: SolutionTemplate;
  readonly task?: {
    readonly id: string;
    readonly taskTypeKey: TaskTypeKey;
  };
}

export interface ValidationResult {
  readonly ruleId: string;
  readonly ruleType: string;
  readonly passed: boolean;
  readonly message?: string;
}

/**
 * The rules for one subject/task/subtype. NOT stored in the DB at this
 * stage — lives as versioned, git-reviewable config modules (a later
 * stage) and gets registered into a `SolutionTemplateRegistry` at
 * startup. Nothing here is math/subject specific: `requiredElements`/
 * `optionalElements` are opaque strings whose vocabulary a concrete
 * template defines for itself.
 */
export interface SolutionTemplate {
  readonly id: string;
  readonly version: string;
  readonly taskTypeKey: TaskTypeKey;
  readonly subtypeId?: string;
  readonly requiredElements: readonly string[];
  readonly optionalElements: readonly string[];
  readonly solutionStructure: {
    readonly order: readonly string[];
  };
  readonly validationRules: readonly ValidationRule[];
  readonly examPresentationRules?: Readonly<Record<string, unknown>>;
}
