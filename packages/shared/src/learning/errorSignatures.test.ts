import { describe, expect, it } from 'vitest';
import { gradeMultiPart, type MultiPartSpec } from '../multiPartAnswer.js';
import { detectErrorSignatures, type DetectErrorSignaturesInput } from './errorSignatures.js';

describe('detectErrorSignatures', () => {
  it('correct answer -> []', () => {
    const result = detectErrorSignatures({
      answerType: 'short_answer',
      isCorrect: true,
      answerRaw: '5',
      correctAnswer: '5',
    });
    expect(result).toEqual([]);
  });

  it('incorrect short_answer -> incorrect_answer (no fabricated precision)', () => {
    const result = detectErrorSignatures({
      answerType: 'short_answer',
      isCorrect: false,
      answerRaw: '6',
      correctAnswer: '5',
    });
    expect(result).toEqual([{ type: 'incorrect_answer', code: 'incorrect_answer' }]);
  });

  it('blank answer -> blank_answer, not incorrect_answer', () => {
    const result = detectErrorSignatures({
      answerType: 'short_answer',
      isCorrect: false,
      answerRaw: '   ',
      correctAnswer: '5',
    });
    expect(result).toEqual([{ type: 'blank_answer', code: 'blank_answer' }]);
  });

  it('empty-string answer (no whitespace at all) also -> blank_answer', () => {
    const result = detectErrorSignatures({
      answerType: 'short_answer',
      isCorrect: false,
      answerRaw: '',
      correctAnswer: '5',
    });
    expect(result).toEqual([{ type: 'blank_answer', code: 'blank_answer' }]);
  });

  it('multiple_choice incorrect -> incorrect_answer (checkAnswer gives no structural signal)', () => {
    const result = detectErrorSignatures({
      answerType: 'multiple_choice',
      isCorrect: false,
      answerRaw: 'B',
      correctAnswer: 'A',
    });
    expect(result).toEqual([{ type: 'incorrect_answer', code: 'incorrect_answer' }]);
  });

  describe('interval answers', () => {
    it('a validly-formatted but wrong interval -> incorrect_answer, not format_error', () => {
      const result = detectErrorSignatures({
        answerType: 'interval',
        isCorrect: false,
        answerRaw: '(1;2)',
        correctAnswer: '(3;5)',
      });
      expect(result).toEqual([{ type: 'incorrect_answer', code: 'incorrect_answer' }]);
    });

    it('an unparseable interval string -> format_error', () => {
      const result = detectErrorSignatures({
        answerType: 'interval',
        isCorrect: false,
        answerRaw: 'something not an interval',
        correctAnswer: '(3;5)',
      });
      expect(result).toEqual([{ type: 'format_error', code: 'format_error' }]);
    });

    it('blank interval answer -> blank_answer, checked before format_error', () => {
      const result = detectErrorSignatures({
        answerType: 'interval',
        isCorrect: false,
        answerRaw: '',
        correctAnswer: '(3;5)',
      });
      expect(result).toEqual([{ type: 'blank_answer', code: 'blank_answer' }]);
    });
  });

  describe('multi_part answers', () => {
    const spec: MultiPartSpec = {
      parts: [
        { id: 'a', label: 'а)', answerType: 'short_answer', correctAnswer: 'да' },
        { id: 'b', label: 'б)', answerType: 'short_answer', correctAnswer: '10' },
        { id: 'c', label: 'в)', answerType: 'short_answer', correctAnswer: '20' },
      ],
    };

    function detectForParts(
      userAnswers: Record<string, string>,
    ): ReturnType<typeof detectErrorSignatures> {
      const grading = gradeMultiPart(spec, userAnswers);
      const input: DetectErrorSignaturesInput = {
        answerType: 'multi_part',
        isCorrect: grading.status === 'all_correct',
        answerRaw: JSON.stringify(userAnswers),
        correctAnswer: JSON.stringify(spec),
        multiPart: { grading, userAnswers },
      };
      return detectErrorSignatures(input);
    }

    it('all parts correct -> []', () => {
      const result = detectForParts({ a: 'да', b: '10', c: '20' });
      expect(result).toEqual([]);
    });

    it('one part wrong (non-blank) -> partially_correct + part_incorrect for that part only', () => {
      const result = detectForParts({ a: 'да', b: '10', c: '99' });
      expect(result).toEqual([
        { type: 'partially_correct', code: 'partially_correct' },
        { type: 'part_incorrect', partId: 'c', code: 'part_incorrect:c' },
      ]);
    });

    it('one part blank -> partially_correct + blank_answer for that part, not part_incorrect', () => {
      const result = detectForParts({ a: 'да', b: '10', c: '' });
      expect(result).toEqual([
        { type: 'partially_correct', code: 'partially_correct' },
        { type: 'blank_answer', partId: 'c', code: 'blank_answer:c' },
      ]);
    });

    it('two parts wrong -> one partially_correct plus one signature per wrong part', () => {
      const result = detectForParts({ a: 'нет', b: '10', c: '99' });
      expect(result).toEqual([
        { type: 'partially_correct', code: 'partially_correct' },
        { type: 'part_incorrect', partId: 'a', code: 'part_incorrect:a' },
        { type: 'part_incorrect', partId: 'c', code: 'part_incorrect:c' },
      ]);
    });

    it('all parts wrong -> no partially_correct, one signature per part, no overall incorrect_answer', () => {
      const result = detectForParts({ a: 'нет', b: '0', c: '0' });
      expect(result).toEqual([
        { type: 'part_incorrect', partId: 'a', code: 'part_incorrect:a' },
        { type: 'part_incorrect', partId: 'b', code: 'part_incorrect:b' },
        { type: 'part_incorrect', partId: 'c', code: 'part_incorrect:c' },
      ]);
    });

    it('all parts blank -> one blank_answer signature per part', () => {
      const result = detectForParts({ a: '', b: '', c: '' });
      expect(result).toEqual([
        { type: 'blank_answer', partId: 'a', code: 'blank_answer:a' },
        { type: 'blank_answer', partId: 'b', code: 'blank_answer:b' },
        { type: 'blank_answer', partId: 'c', code: 'blank_answer:c' },
      ]);
    });

    it('a missing multiPart context on an incorrect multi_part input falls back to incorrect_answer (defensive, should not happen in practice)', () => {
      const result = detectErrorSignatures({
        answerType: 'multi_part',
        isCorrect: false,
        answerRaw: '{}',
        correctAnswer: JSON.stringify(spec),
      });
      expect(result).toEqual([{ type: 'incorrect_answer', code: 'incorrect_answer' }]);
    });
  });

  it('is deterministic: the same input always yields the same result', () => {
    const input: DetectErrorSignaturesInput = {
      answerType: 'short_answer',
      isCorrect: false,
      answerRaw: 'wrong',
      correctAnswer: 'right',
    };
    expect(detectErrorSignatures(input)).toEqual(detectErrorSignatures(input));
  });

  it('never branches on any task-number-like field — the input type carries none', () => {
    // Structural guarantee: DetectErrorSignaturesInput has no taskNumber/taskId
    // field at all, so no implementation could branch on it even by accident.
    const input: DetectErrorSignaturesInput = {
      answerType: 'short_answer',
      isCorrect: false,
      answerRaw: 'x',
      correctAnswer: 'y',
    };
    expect('taskNumber' in input).toBe(false);
    expect('taskId' in input).toBe(false);
  });
});
