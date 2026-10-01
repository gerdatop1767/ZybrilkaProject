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

/**
 * What kind of claim a critical point makes — kept as three fixed
 * values (not a free-form string like `SolutionStep.kind`) because the
 * project owner asked for these three to never be blended into one
 * undifferentiated "requirements" list:
 *   - 'correctness': a core solving-logic fact (e.g. "√A=√B needs
 *     B⩾0") — about mathematical/domain correctness, independent of
 *     how the exam scores it. Generalizes "mathematical requirement"
 *     from the architecture note to stay subject-agnostic wording.
 *   - 'exam_scoring': tied to how the exam actually grades the task —
 *     only ever populated from a source the project owner has
 *     verified against the primary FIPI document (see `source`).
 *   - 'presentation': a recommendation about how to present the
 *     solution — must never be `required: true` (FIPI explicitly
 *     allows free method/write-up form).
 */
export type CriticalPointCategory = 'correctness' | 'exam_scoring' | 'presentation';

/**
 * One exam-significant element of a canonical solution — what should
 * be visible/true for the solution to be complete for THIS task, and
 * why. `validationRuleId`, when set, must name a `ValidationRule.id`
 * already present on the same template's `validationRules` — this
 * point is then only a descriptive cross-reference to that rule's real
 * structural check (see `checkCriticalPoints`), never a second,
 * independent execution path. Many points legitimately have no
 * `validationRuleId` at all — `required: true` describes the point's
 * domain/exam significance, not whether it happens to be
 * automatable without AI/CAS.
 */
export interface ExamCriticalPoint {
  readonly id: string;
  readonly text: string;
  readonly category: CriticalPointCategory;
  readonly required: boolean;
  readonly partId?: string;
  readonly rationale?: string;
  readonly validationRuleId?: string;
  /**
   * 'fipi_verified' only for a fact directly confirmed against the
   * primary FIPI document itself (doc.fipi.ru — e.g. the project
   * owner's earlier relay of the grading methodology for №13).
   * 'secondary_source_verified' for a fact confirmed against a
   * reputable secondary aggregator of FIPI's criteria (e.g. an
   * established exam-prep reference site) when the primary document
   * wasn't directly reachable — real, checkable, but one step removed
   * from the primary source, and must never be presented to the
   * learner as identical in standing to 'fipi_verified'.
   * 'project_quality_rule' for an internal rule this project chose
   * (real math correctness, or a house style preference) that FIPI's
   * methodology does not itself state — never presented as an
   * official requirement.
   */
  readonly source: 'fipi_verified' | 'secondary_source_verified' | 'project_quality_rule';
}

/**
 * One structural part of a task's solution (e.g. "а)"/"б)" on a
 * two-part EGE task, a single "main" part on a one-part task, a
 * criterion block on a non-math subject — same generalization
 * `MultiPartPart` already uses for grading, applied here to solution
 * *content* instead. `hasCheckableAnswer: false` is for parts with no
 * single checkable value (a pure derivation/proof) — this
 * `CanonicalSolution.parts[].answer` is reference content for display,
 * never fed through `answerChecker`/`gradeMultiPart` (that remains a
 * separate, untouched runtime system — see architecture doc §J/K).
 */
export interface PartSolution {
  readonly id: string;
  readonly label: string;
  readonly steps: readonly SolutionStep[];
  readonly hasCheckableAnswer: boolean;
  readonly answer?: string;
  readonly answerDisplay?: string;
}

/**
 * The concrete solution content for one specific task. `parts` is
 * always at least one entry — a single-part task is `parts: [{ id:
 * 'main', ... }]`, not a special case. Exactly one set of parts is the
 * canonical/primary path at this stage. `alternativeSolutions` is a
 * forward-looking architectural placeholder only (approved
 * architecture doc, "K"/"G. Validation rules" — FIPI explicitly allows
 * a different correct method, so this must eventually be real, but not
 * yet) — no code in this foundation reads or validates it, and it must
 * not be populated yet.
 */
export interface CanonicalSolution {
  readonly taskId: string;
  readonly templateId: string;
  readonly templateVersion: string;
  readonly parts: readonly PartSolution[];
  readonly examWriteup?: ExamWriteup;
  readonly criticalPoints?: readonly ExamCriticalPoint[];
  /** Free-form labels describing the method used (e.g. "substitution", "factoring") — metadata, never a requirement (a template must never mandate a method, see architecture doc facts 6-7). */
  readonly methodTags?: readonly string[];
  /** Architectural placeholder for future method A/B/C support — not implemented; must stay unpopulated for now. */
  readonly alternativeSolutions?: readonly (readonly PartSolution[])[];
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
