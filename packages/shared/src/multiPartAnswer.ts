/**
 * Multi-part answers (S3.1): a task like "а) ...; б) ...; в) ..." with
 * three independent sub-answers that don't fit a single text field.
 * Reuses the existing single `tasks.correct_answer` / `tasks.answer_raw`
 * TEXT columns by convention — when `answerType === 'multi_part'` they
 * hold JSON instead of a plain string — rather than adding a parallel
 * table, per the "don't build a second model if the existing one can
 * hold it" rule.
 */
import { checkAnswer } from './answerChecker.js';
import { checkIntervalAnswer } from './intervalAnswer.js';

export type PartAnswerType = 'short_answer' | 'interval';

export interface MultiPartPart {
  id: string;
  label: string;
  answerType: PartAnswerType;
  correctAnswer: string;
}

export interface MultiPartSpec {
  parts: readonly MultiPartPart[];
}

export type MultiPartUserAnswer = Readonly<Record<string, string>>;

export interface MultiPartPartResult {
  id: string;
  label: string;
  correct: boolean;
}

export type MultiPartStatus = 'all_correct' | 'partially_correct' | 'all_incorrect';

export interface MultiPartGradeResult {
  parts: readonly MultiPartPartResult[];
  correctParts: number;
  totalParts: number;
  status: MultiPartStatus;
}

/** Parses the JSON stored in `correctAnswer` for a multi_part task. Returns `null` on malformed JSON rather than throwing. */
export function parseMultiPartSpec(json: string): MultiPartSpec | null {
  try {
    const data: unknown = JSON.parse(json);
    if (
      typeof data !== 'object' ||
      data === null ||
      !('parts' in data) ||
      !Array.isArray((data as { parts: unknown }).parts)
    ) {
      return null;
    }
    const parts = (data as { parts: unknown[] }).parts;
    const valid = parts.every(
      (p): p is MultiPartPart =>
        typeof p === 'object' &&
        p !== null &&
        typeof (p as MultiPartPart).id === 'string' &&
        typeof (p as MultiPartPart).label === 'string' &&
        (p as MultiPartPart).answerType !== undefined &&
        typeof (p as MultiPartPart).correctAnswer === 'string',
    );
    if (!valid || parts.length === 0) return null;
    return { parts: parts as MultiPartPart[] };
  } catch {
    return null;
  }
}

export function serializeMultiPartSpec(spec: MultiPartSpec): string {
  return JSON.stringify(spec);
}

/** Parses the JSON stored in `attempts.answer_raw` for a multi_part attempt. */
export function parseMultiPartUserAnswer(json: string): MultiPartUserAnswer | null {
  try {
    const data: unknown = JSON.parse(json);
    if (typeof data !== 'object' || data === null || Array.isArray(data)) return null;
    const entries = Object.entries(data as Record<string, unknown>);
    if (entries.length === 0) return null;
    if (!entries.every(([, v]) => typeof v === 'string')) return null;
    return data as MultiPartUserAnswer;
  } catch {
    return null;
  }
}

export function serializeMultiPartUserAnswer(answer: MultiPartUserAnswer): string {
  return JSON.stringify(answer);
}

function checkPart(answerType: PartAnswerType, userAnswer: string, correctAnswer: string): boolean {
  if (userAnswer.trim() === '') return false;
  if (answerType === 'interval') return checkIntervalAnswer(userAnswer, correctAnswer);
  return checkAnswer(userAnswer, correctAnswer);
}

/**
 * Grades every part independently. A missing user answer for a part
 * (not present in `userAnswers`) is treated as an empty/incorrect
 * answer for that part, never as a crash.
 */
export function gradeMultiPart(
  spec: MultiPartSpec,
  userAnswers: MultiPartUserAnswer,
): MultiPartGradeResult {
  const parts = spec.parts.map((part) => ({
    id: part.id,
    label: part.label,
    correct: checkPart(part.answerType, userAnswers[part.id] ?? '', part.correctAnswer),
  }));
  const correctParts = parts.filter((p) => p.correct).length;
  const totalParts = parts.length;
  const status: MultiPartStatus =
    correctParts === totalParts
      ? 'all_correct'
      : correctParts === 0
        ? 'all_incorrect'
        : 'partially_correct';

  return { parts, correctParts, totalParts, status };
}
