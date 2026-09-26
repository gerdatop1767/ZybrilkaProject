import { describe, expect, it } from 'vitest';
import { checkAnswer, normalizeAnswer } from './answerChecker.js';

describe('normalizeAnswer', () => {
  it('trims, lowercases, and collapses whitespace', () => {
    expect(normalizeAnswer('  Ответ  ')).toBe('ответ');
    expect(normalizeAnswer('a   b')).toBe('a b');
  });

  it('treats ё and е as equivalent', () => {
    expect(normalizeAnswer('трёх')).toBe(normalizeAnswer('трех'));
  });

  it('treats comma and dot as equivalent decimal separators', () => {
    expect(normalizeAnswer('0,4')).toBe(normalizeAnswer('0.4'));
  });
});

describe('checkAnswer', () => {
  it('accepts an exact match', () => {
    expect(checkAnswer('4', '4')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(checkAnswer('ДА', 'да')).toBe(true);
  });

  it('accepts a decimal comma against a decimal dot', () => {
    expect(checkAnswer('0,4', '0.4')).toBe(true);
  });

  it('treats numerically-equal values as equal regardless of formatting', () => {
    expect(checkAnswer('6.0', '6')).toBe(true);
    expect(checkAnswer('6', '6.00')).toBe(true);
  });

  it('is order-insensitive for multi-value answers', () => {
    expect(checkAnswer('5 2', '2 5')).toBe(true);
    expect(checkAnswer('2, 5', '5; 2')).toBe(true);
  });

  it('rejects a wrong multi-value answer', () => {
    expect(checkAnswer('2 3', '2 5')).toBe(false);
  });

  it('rejects a genuinely wrong answer', () => {
    expect(checkAnswer('5', '4')).toBe(false);
  });

  it('rejects an empty answer against a real one', () => {
    expect(checkAnswer('', '4')).toBe(false);
  });

  it('does not treat a numeric string as equal to a non-numeric one', () => {
    expect(checkAnswer('да', '4')).toBe(false);
  });
});
