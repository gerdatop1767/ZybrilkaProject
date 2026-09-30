import { describe, expect, it } from 'vitest';
import { checkAnswer } from '../answerChecker.js';
import { gradeMultiPart, type MultiPartSpec } from '../multiPartAnswer.js';

/**
 * (H) The canonical-solution engine/pipeline is a separate, parallel
 * system — it must never need changes to, or interfere with, the
 * existing learner-answer grading path. This test doesn't exercise new
 * code; it's a guard that `answerChecker`/`multiPartAnswer` keep
 * working exactly as before, untouched by anything added in this
 * stage (see the module docs in pipeline.ts/runValidation.ts: neither
 * imports or calls into these modules at all).
 */
describe('existing answer checking is unaffected by the solution engine (H)', () => {
  it('checkAnswer still grades a plain learner answer', () => {
    expect(checkAnswer('-4π; -3π; -8π/3', '-4π; -3π; -8π/3')).toBe(true);
    expect(checkAnswer('wrong', '-4π; -3π; -8π/3')).toBe(false);
  });

  it('gradeMultiPart still grades independently, per part', () => {
    const spec: MultiPartSpec = {
      parts: [
        { id: 'a', label: 'а', answerType: 'short_answer', correctAnswer: 'нет' },
        { id: 'b', label: 'б', answerType: 'short_answer', correctAnswer: '607' },
      ],
    };
    const grade = gradeMultiPart(spec, { a: 'нет', b: 'wrong' });
    expect(grade.status).toBe('partially_correct');
    expect(grade.parts).toEqual([
      { id: 'a', label: 'а', correct: true },
      { id: 'b', label: 'б', correct: false },
    ]);
  });
});
