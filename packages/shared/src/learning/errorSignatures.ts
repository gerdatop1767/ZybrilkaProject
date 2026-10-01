/**
 * ZUBRILKA LEARNING INTELLIGENCE, Phase 5 — deterministic error
 * signatures. No AI/ML: every signature here is derived only from data
 * the server already has at grading time — `answerChecker`'s boolean
 * result, the task's own `answerType`, the raw submitted answer, and
 * (for `multi_part`) the existing per-part grading from
 * `multiPartAnswer.ts`'s `gradeMultiPart`.
 *
 * What CANNOT be honestly determined from this data, and is therefore
 * NOT attempted here: *why* a wrong numeric/algebraic answer is wrong
 * (sign error, arithmetic slip, wrong method, geometric misreading,
 * etc.) — `answerChecker.checkAnswer` only ever returns a boolean, with
 * no structural comparison between the user's and the correct answer's
 * mathematical form. Claiming a specific cause from `"6" !== "5"` alone
 * would be fabricated precision, not a real signal. Those cases fall
 * back to the generic `incorrect_answer`, which is honest about what we
 * actually know (see CLAUDE.md Phase 5 instructions §4/§19).
 *
 * Signatures this CAN honestly determine:
 * - `blank_answer`: the submitted answer (or multi_part sub-answer) is
 *   empty/whitespace-only — a simple string check, not inference.
 * - `format_error`: for `interval`-type tasks only, the user's answer
 *   fails to parse as interval-set notation at all (`parseIntervalSet`
 *   returns null) — distinct from a validly-formatted but wrong
 *   interval, which is `incorrect_answer`.
 * - `partially_correct` / `part_incorrect`: for `multi_part` tasks
 *   only, straight from `gradeMultiPart`'s own per-part/status result —
 *   not inferred, just read off data that's already computed.
 * - `incorrect_answer`: the honest fallback for everything else.
 */
import { parseIntervalSet } from '../intervalAnswer.js';
import type { MultiPartGradeResult, MultiPartUserAnswer } from '../multiPartAnswer.js';

export const errorSignatureTypes = [
  'incorrect_answer',
  'blank_answer',
  'format_error',
  'partially_correct',
  'part_incorrect',
] as const;
export type ErrorSignatureType = (typeof errorSignatureTypes)[number];

export interface ErrorSignature {
  readonly type: ErrorSignatureType;
  /** Only set for `multi_part` per-part signatures (`part_incorrect`, or `blank_answer` on one sub-answer). */
  readonly partId?: string;
  /** Stable string key for storage/aggregation: `type`, or `${type}:${partId}` when `partId` is set. */
  readonly code: string;
}

function signature(type: ErrorSignatureType, partId?: string): ErrorSignature {
  return partId ? { type, partId, code: `${type}:${partId}` } : { type, code: type };
}

export type DetectableAnswerType = 'short_answer' | 'multiple_choice' | 'interval' | 'multi_part';

export interface DetectErrorSignaturesInput {
  readonly answerType: DetectableAnswerType;
  readonly isCorrect: boolean;
  /** Raw submitted answer for non-multi_part types; ignored (use `multiPart`) for multi_part. */
  readonly answerRaw: string;
  readonly correctAnswer: string;
  /** Required when `answerType === 'multi_part'`. */
  readonly multiPart?: {
    readonly grading: MultiPartGradeResult;
    readonly userAnswers: MultiPartUserAnswer;
  };
}

/**
 * Pure and deterministic: the same input always yields the same
 * signatures, in the same order, with no DB access and no dependency
 * on `taskNumber` — only `answerType` and the grading data decide the
 * result. A correct answer always yields `[]`.
 */
export function detectErrorSignatures(input: DetectErrorSignaturesInput): ErrorSignature[] {
  if (input.isCorrect) return [];

  if (input.answerType === 'multi_part') {
    if (!input.multiPart) return [signature('incorrect_answer')];
    const { grading, userAnswers } = input.multiPart;

    const signatures: ErrorSignature[] = [];
    if (grading.status === 'partially_correct') signatures.push(signature('partially_correct'));

    for (const part of grading.parts) {
      if (part.correct) continue;
      const partAnswer = (userAnswers[part.id] ?? '').trim();
      signatures.push(
        partAnswer === ''
          ? signature('blank_answer', part.id)
          : signature('part_incorrect', part.id),
      );
    }

    return signatures.length > 0 ? signatures : [signature('incorrect_answer')];
  }

  if (input.answerRaw.trim() === '') return [signature('blank_answer')];

  if (input.answerType === 'interval' && parseIntervalSet(input.answerRaw) === null) {
    return [signature('format_error')];
  }

  return [signature('incorrect_answer')];
}
