import { describe, expect, it } from 'vitest';
import {
  gradeMultiPart,
  parseMultiPartSpec,
  parseMultiPartUserAnswer,
  serializeMultiPartSpec,
  serializeMultiPartUserAnswer,
  type MultiPartSpec,
} from './multiPartAnswer.js';

const spec: MultiPartSpec = {
  parts: [
    { id: 'a', label: 'а', answerType: 'short_answer', correctAnswer: 'нет' },
    { id: 'b', label: 'б', answerType: 'short_answer', correctAnswer: '607' },
    { id: 'c', label: 'в', answerType: 'short_answer', correctAnswer: '1066' },
  ],
};

describe('parseMultiPartSpec / serializeMultiPartSpec', () => {
  it('round-trips a spec through JSON', () => {
    const json = serializeMultiPartSpec(spec);
    expect(parseMultiPartSpec(json)).toEqual(spec);
  });

  it('returns null for malformed JSON rather than throwing', () => {
    expect(parseMultiPartSpec('not json')).toBeNull();
    expect(() => parseMultiPartSpec('not json')).not.toThrow();
  });

  it('returns null when parts is missing, empty, or not an array', () => {
    expect(parseMultiPartSpec('{}')).toBeNull();
    expect(parseMultiPartSpec('{"parts":[]}')).toBeNull();
    expect(parseMultiPartSpec('{"parts":"nope"}')).toBeNull();
  });

  it('returns null when a part is missing a required field', () => {
    expect(parseMultiPartSpec('{"parts":[{"id":"a","label":"а"}]}')).toBeNull();
  });
});

describe('parseMultiPartUserAnswer / serializeMultiPartUserAnswer', () => {
  it('round-trips a user answer through JSON', () => {
    const answer = { a: 'нет', b: '607', c: '1066' };
    expect(parseMultiPartUserAnswer(serializeMultiPartUserAnswer(answer))).toEqual(answer);
  });

  it('returns null for malformed JSON, an array, or non-string values', () => {
    expect(parseMultiPartUserAnswer('not json')).toBeNull();
    expect(parseMultiPartUserAnswer('[]')).toBeNull();
    expect(parseMultiPartUserAnswer('{}')).toBeNull();
    expect(parseMultiPartUserAnswer('{"a":42}')).toBeNull();
  });
});

describe('gradeMultiPart', () => {
  it('all parts correct', () => {
    const result = gradeMultiPart(spec, { a: 'нет', b: '607', c: '1066' });
    expect(result.status).toBe('all_correct');
    expect(result.correctParts).toBe(3);
    expect(result.totalParts).toBe(3);
    expect(result.parts).toEqual([
      { id: 'a', label: 'а', correct: true },
      { id: 'b', label: 'б', correct: true },
      { id: 'c', label: 'в', correct: true },
    ]);
  });

  it('all parts incorrect', () => {
    const result = gradeMultiPart(spec, { a: 'да', b: '1', c: '2' });
    expect(result.status).toBe('all_incorrect');
    expect(result.correctParts).toBe(0);
  });

  it('only part а correct', () => {
    const result = gradeMultiPart(spec, { a: 'нет', b: '1', c: '2' });
    expect(result.status).toBe('partially_correct');
    expect(result.parts[0]).toMatchObject({ id: 'a', correct: true });
    expect(result.parts[1]).toMatchObject({ id: 'b', correct: false });
    expect(result.parts[2]).toMatchObject({ id: 'c', correct: false });
  });

  it('only part б correct', () => {
    const result = gradeMultiPart(spec, { a: 'да', b: '607', c: '2' });
    expect(result.parts.map((p) => p.correct)).toEqual([false, true, false]);
  });

  it('only part в correct', () => {
    const result = gradeMultiPart(spec, { a: 'да', b: '1', c: '1066' });
    expect(result.parts.map((p) => p.correct)).toEqual([false, false, true]);
  });

  it('2 out of 3 correct is partially_correct with correctParts=2', () => {
    const result = gradeMultiPart(spec, { a: 'нет', b: '607', c: '2' });
    expect(result.status).toBe('partially_correct');
    expect(result.correctParts).toBe(2);
    expect(result.totalParts).toBe(3);
  });

  it('a missing/empty answer for a part counts as incorrect, not a crash', () => {
    const result = gradeMultiPart(spec, { a: 'нет', b: '', c: '1066' });
    expect(result.parts[1]).toMatchObject({ correct: false });
    const resultMissing = gradeMultiPart(spec, { a: 'нет', c: '1066' });
    expect(resultMissing.parts[1]).toMatchObject({ correct: false });
    expect(resultMissing.correctParts).toBe(2);
  });

  it('grades an interval-type part using interval comparison', () => {
    const intervalSpec: MultiPartSpec = {
      parts: [{ id: 'x', label: 'x', answerType: 'interval', correctAnswer: '(-∞;3]' }],
    };
    expect(gradeMultiPart(intervalSpec, { x: '(-inf,3]' }).status).toBe('all_correct');
    expect(gradeMultiPart(intervalSpec, { x: '(-inf,3)' }).status).toBe('all_incorrect');
  });

  it('an invalid answer format in one part just fails that part', () => {
    const result = gradeMultiPart(spec, { a: 'нет', b: 'not-a-number-42', c: '1066' });
    expect(result.parts[1]).toMatchObject({ correct: false });
    expect(result.status).toBe('partially_correct');
  });
});
