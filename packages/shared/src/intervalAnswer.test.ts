import { describe, expect, it } from 'vitest';
import { checkIntervalAnswer, parseBound, parseIntervalSet } from './intervalAnswer.js';

describe('parseBound', () => {
  it('parses integers and decimals', () => {
    expect(parseBound('3')).toBe(3);
    expect(parseBound('5.4')).toBe(5.4);
    expect(parseBound('5,4')).toBe(5.4);
  });

  it('parses negative numbers (ASCII hyphen and typeset minus)', () => {
    expect(parseBound('-3')).toBe(-3);
    expect(parseBound('−3')).toBe(-3);
  });

  it('parses infinities', () => {
    expect(parseBound('-∞')).toBe(-Infinity);
    expect(parseBound('+∞')).toBe(Infinity);
    expect(parseBound('∞')).toBe(Infinity);
    expect(parseBound('-inf')).toBe(-Infinity);
    expect(parseBound('+infinity')).toBe(Infinity);
  });

  it('parses simple fractions', () => {
    expect(parseBound('3/2')).toBe(1.5);
  });

  it('parses sqrt and log expressions', () => {
    expect(parseBound('√9')).toBe(3);
    expect(parseBound('sqrt(16)')).toBe(4);
    expect(parseBound('log_5(2)')).toBeCloseTo(Math.log(2) / Math.log(5), 10);
  });

  it('returns null for garbage input', () => {
    expect(parseBound('abc')).toBeNull();
    expect(parseBound('')).toBeNull();
    expect(parseBound('3/0')).toBeNull();
  });
});

describe('parseIntervalSet', () => {
  it('parses a single closed-open interval', () => {
    expect(parseIntervalSet('(-∞;3]')).toEqual([
      { left: -Infinity, leftClosed: false, right: 3, rightClosed: true },
    ]);
  });

  it('accepts comma as a separator when no semicolon is present', () => {
    expect(parseIntervalSet('(-∞,3]')).toEqual([
      { left: -Infinity, leftClosed: false, right: 3, rightClosed: true },
    ]);
  });

  it('parses a union of two intervals with ∪ or ASCII U', () => {
    const expected = [
      { left: -Infinity, leftClosed: false, right: -1, rightClosed: true },
      { left: 2, leftClosed: false, right: Infinity, rightClosed: false },
    ];
    expect(parseIntervalSet('(−∞;−1] ∪ (2;+∞)')).toEqual(expected);
    expect(parseIntervalSet('(-inf,-1] U (2,+inf)')).toEqual(expected);
  });

  it('sorts union segments regardless of input order', () => {
    const a = parseIntervalSet('(2;+∞) ∪ (-∞;-1]');
    const b = parseIntervalSet('(-∞;-1] ∪ (2;+∞)');
    expect(a).toEqual(b);
  });

  it('supports irrational (log) bounds, e.g. a punctured interval expressed as two unions', () => {
    const result = parseIntervalSet('(log_5(2);log_5(8)) ∪ (log_5(8);log_3(8)]');
    expect(result).not.toBeNull();
    expect(result).toHaveLength(2);
    expect(result![0]!.left).toBeCloseTo(Math.log(2) / Math.log(5), 10);
    expect(result![1]!.right).toBeCloseTo(Math.log(8) / Math.log(3), 10);
  });

  it('returns null for an invalid string (INVALID_ANSWER_FORMAT), never throws', () => {
    expect(parseIntervalSet('not an interval')).toBeNull();
    expect(parseIntervalSet('(3;')).toBeNull();
    expect(parseIntervalSet('')).toBeNull();
    expect(() => parseIntervalSet('(3;')).not.toThrow();
  });

  it('rejects a closed bracket at an infinite endpoint', () => {
    expect(parseIntervalSet('[-∞;3]')).toBeNull();
    expect(parseIntervalSet('[3;+∞]')).toBeNull();
  });

  it('ignores surrounding and internal whitespace', () => {
    expect(parseIntervalSet('  ( -∞ ; 3 ]  ')).toEqual(parseIntervalSet('(-∞;3]'));
  });
});

describe('checkIntervalAnswer', () => {
  it('(-∞;3] equals (-∞,3]', () => {
    expect(checkIntervalAnswer('(-∞;3]', '(-∞,3]')).toBe(true);
  });

  it('a union matches the same union written with ASCII "U" and commas', () => {
    expect(checkIntervalAnswer('(-∞,-1] U (2,+inf)', '(−∞;−1] ∪ (2;+∞)')).toBe(true);
  });

  it('(1;5) does not equal [1;5] — bracket type matters', () => {
    expect(checkIntervalAnswer('(1;5)', '[1;5]')).toBe(false);
  });

  it('(1;5) does not equal (1;6) — bound value matters', () => {
    expect(checkIntervalAnswer('(1;5)', '(1;6)')).toBe(false);
  });

  it('(-∞;3] does not equal (-∞;3) — closedness matters', () => {
    expect(checkIntervalAnswer('(-∞;3]', '(-∞;3)')).toBe(false);
  });

  it('an invalid string is simply incorrect, not a crash', () => {
    expect(checkIntervalAnswer('garbage', '(-∞;3]')).toBe(false);
    expect(() => checkIntervalAnswer('garbage', '(-∞;3]')).not.toThrow();
  });

  it('negative numeric bounds compare correctly', () => {
    expect(checkIntervalAnswer('[-5;-2]', '[-5;-2]')).toBe(true);
    expect(checkIntervalAnswer('[-5;-2]', '[-5;-2.01]')).toBe(false);
  });

  it('decimal bounds compare correctly', () => {
    expect(checkIntervalAnswer('(0;5.5]', '(0;5,5]')).toBe(true);
  });

  it('a single interval never matches a two-interval union', () => {
    expect(checkIntervalAnswer('(-∞;-1]', '(-∞;-1] ∪ (2;+∞)')).toBe(false);
  });

  it('the exact punctured-interval answer for task 15 matches itself', () => {
    const answer = '(log_5(2);log_5(8)) ∪ (log_5(8);log_3(8)]';
    expect(checkIntervalAnswer(answer, answer)).toBe(true);
  });
});
