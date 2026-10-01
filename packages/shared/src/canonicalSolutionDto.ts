/**
 * The public, serializable wire contract for a task's canonical
 * solution — what actually crosses the API boundary into
 * `TaskWithSolution.canonicalSolution` (see tasks.ts). Deliberately
 * separate from `solutionEngine/types.ts`: those are internal
 * architecture types (registries, declarative validation rules,
 * placeholders not populated yet); this file is the stable, minimal
 * shape a client is allowed to see — no executable validator
 * functions, no registry objects, no internal `ruleType` dispatch
 * tags, no DB row fields.
 */
import { z } from 'zod';
import type { SolutionPipelineResult } from './solutionEngine/pipeline.js';

export const canonicalSolutionStepDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  explanation: z.string(),
  kind: z.string().optional(),
});
export type CanonicalSolutionStepDto = z.infer<typeof canonicalSolutionStepDtoSchema>;

export const canonicalSolutionPartDtoSchema = z.object({
  id: z.string(),
  label: z.string(),
  hasCheckableAnswer: z.boolean(),
  answer: z.string().optional(),
  answerDisplay: z.string().optional(),
  steps: z.array(canonicalSolutionStepDtoSchema),
});
export type CanonicalSolutionPartDto = z.infer<typeof canonicalSolutionPartDtoSchema>;

export const canonicalSolutionCriticalPointStatusSchema = z.enum([
  'satisfied',
  'not_satisfied',
  'unlinked',
  'unresolvable_rule',
]);
export type CanonicalSolutionCriticalPointStatus = z.infer<
  typeof canonicalSolutionCriticalPointStatusSchema
>;

export const canonicalSolutionCriticalPointDtoSchema = z.object({
  id: z.string(),
  text: z.string(),
  category: z.enum(['correctness', 'exam_scoring', 'presentation']),
  required: z.boolean(),
  partId: z.string().optional(),
  rationale: z.string().optional(),
  /** Never presented to the client as an unqualified "требование ФИПИ" without this — see the architecture note. 'secondary_source_verified' is one step removed from the primary FIPI document (a reputable aggregator, not doc.fipi.ru itself) — never collapsed into 'fipi_verified'. */
  source: z.enum(['fipi_verified', 'secondary_source_verified', 'project_quality_rule']),
  /** Resolved server-side from `checkCriticalPoints` — the client never re-derives this from validation results itself. */
  status: canonicalSolutionCriticalPointStatusSchema,
});
export type CanonicalSolutionCriticalPointDto = z.infer<
  typeof canonicalSolutionCriticalPointDtoSchema
>;

export const canonicalSolutionValidationResultDtoSchema = z.object({
  ruleId: z.string(),
  passed: z.boolean(),
  message: z.string().optional(),
});

export const canonicalSolutionDtoSchema = z.object({
  templateId: z.string(),
  templateVersion: z.string(),
  parts: z.array(canonicalSolutionPartDtoSchema),
  examWriteup: z.string().optional(),
  criticalPoints: z.array(canonicalSolutionCriticalPointDtoSchema),
  validation: z.object({
    status: z.enum(['validated', 'validation_failed']),
    results: z.array(canonicalSolutionValidationResultDtoSchema),
  }),
});
export type CanonicalSolutionDto = z.infer<typeof canonicalSolutionDtoSchema>;

/**
 * Converts a `runCanonicalSolutionPipeline` result into the DTO above.
 * Returns `undefined` when the pipeline didn't produce a usable
 * canonical solution (no template registered, or no canonical solution
 * was built for this task) — the caller (API service layer) then
 * simply omits `canonicalSolution` from its response, which is always
 * a valid, backward-compatible `TaskWithSolution` shape.
 */
export function toCanonicalSolutionDto(
  result: Pick<
    SolutionPipelineResult,
    'template' | 'canonicalSolution' | 'validationResults' | 'status' | 'criticalPointChecks'
  >,
): CanonicalSolutionDto | undefined {
  const { template, canonicalSolution, validationResults, status, criticalPointChecks } = result;
  if (!template || !canonicalSolution || status === 'no_template') return undefined;

  const checkStatusByPointId = new Map(
    criticalPointChecks.map((c) => [c.criticalPointId, c.status]),
  );

  return {
    templateId: template.id,
    templateVersion: template.version,
    parts: canonicalSolution.parts.map((part) => ({
      id: part.id,
      label: part.label,
      hasCheckableAnswer: part.hasCheckableAnswer,
      answer: part.answer,
      answerDisplay: part.answerDisplay,
      steps: part.steps.map((step) => ({
        id: step.id,
        title: step.title,
        explanation: step.explanation,
        kind: step.kind,
      })),
    })),
    examWriteup: canonicalSolution.examWriteup?.content,
    criticalPoints: (canonicalSolution.criticalPoints ?? []).map((point) => ({
      id: point.id,
      text: point.text,
      category: point.category,
      required: point.required,
      partId: point.partId,
      rationale: point.rationale,
      source: point.source,
      status: checkStatusByPointId.get(point.id) ?? 'unlinked',
    })),
    validation: {
      status,
      results: validationResults.map((r) => ({
        ruleId: r.ruleId,
        passed: r.passed,
        message: r.message,
      })),
    },
  };
}
