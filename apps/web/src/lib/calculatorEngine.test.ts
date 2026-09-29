import { describe, expect, it } from 'vitest';
import {
  applyKey,
  initialCalculatorState,
  type CalculatorKey,
  type CalculatorState,
} from './calculatorEngine.js';

function type(keys: readonly CalculatorKey[], start: CalculatorState = initialCalculatorState()) {
  return keys.reduce((state, key) => applyKey(state, key), start);
}

describe('calculatorEngine (Task Workspace block 3 — shared core)', () => {
  it('adds two numbers', () => {
    const state = type(['1', '2', '+', '3', '=']);
    expect(state.result).toBe('15');
    expect(state.error).toBe(false);
  });

  it('subtracts', () => {
    expect(type(['9', '-', '4', '=']).result).toBe('5');
  });

  it('multiplies (×)', () => {
    expect(type(['6', '×', '7', '=']).result).toBe('42');
  });

  it('divides (÷)', () => {
    expect(type(['8', '÷', '2', '=']).result).toBe('4');
  });

  it('respects operator precedence: 2+3×4=14, not 20', () => {
    expect(type(['2', '+', '3', '×', '4', '=']).result).toBe('14');
  });

  it('parentheses override precedence: (2+3)×4=20', () => {
    expect(type(['(', '2', '+', '3', ')', '×', '4', '=']).result).toBe('20');
  });

  it('handles decimals', () => {
    expect(type(['1', '.', '5', '+', '2', '.', '5', '=']).result).toBe('4');
  });

  it('division by zero is an error, not a crash or Infinity', () => {
    const state = type(['5', '÷', '0', '=']);
    expect(state.error).toBe(true);
    expect(state.result).toBeNull();
  });

  it('AC clears everything back to the initial state', () => {
    const state = type(['1', '2', '3', '+', '4', 'AC']);
    expect(state).toEqual(initialCalculatorState());
  });

  it('± negates the number currently being typed', () => {
    expect(type(['5', '±']).expression).toBe('-5');
    // toggling twice returns to positive
    expect(type(['5', '±', '±']).expression).toBe('5');
  });

  it('± after an operator negates the new number, not the whole expression', () => {
    expect(type(['1', '2', '+', '5', '±']).expression).toBe('12+-5');
  });

  it('% divides the current number by 100', () => {
    expect(type(['5', '0', '%']).expression).toBe('0.5');
  });

  it('pressing an operator twice replaces the first instead of stacking (12++3 never happens)', () => {
    expect(type(['1', '2', '+', '-']).expression).toBe('12-');
  });

  it('leading zeros collapse: 0 then 5 gives "5", not "05"', () => {
    expect(type(['0', '5']).expression).toBe('5');
  });

  it('only one decimal point per number', () => {
    expect(type(['1', '.', '2', '.', '3']).expression).toBe('1.23');
  });

  it('continuing with a digit after "=" starts a fresh expression', () => {
    const afterEquals = type(['1', '2', '+', '3', '=']);
    const next = applyKey(afterEquals, '7');
    expect(next.expression).toBe('7');
    expect(next.result).toBeNull();
  });

  it('continuing with an operator after "=" chains from the previous result (12+3=15, then +5=20)', () => {
    const afterEquals = type(['1', '2', '+', '3', '=']);
    const chained = type(['+', '5', '='], afterEquals);
    expect(chained.result).toBe('20');
  });

  it('a malformed expression (unmatched paren typed as literal via error state) recovers on the next key', () => {
    const errored = type(['5', '÷', '0', '=']);
    expect(errored.error).toBe(true);
    const recovered = applyKey(errored, '9');
    expect(recovered.error).toBe(false);
    expect(recovered.expression).toBe('9');
  });

  it('an unmatched closing paren is simply ignored, never crashes', () => {
    expect(type([')', '5']).expression).toBe('5');
  });

  it('an implicit × is inserted before "(" following a number: 2(3+4)=14', () => {
    const state = type(['2', '(', '3', '+', '4', ')', '=']);
    expect(state.expression).toBe('2×(3+4)');
    expect(state.result).toBe('14');
  });

  it('"=" on an empty expression is a no-op', () => {
    expect(type(['='])).toEqual(initialCalculatorState());
  });

  it('rounds away floating point noise (0.1 + 0.2 = 0.3, not 0.30000000000000004)', () => {
    expect(type(['0', '.', '1', '+', '0', '.', '2', '=']).result).toBe('0.3');
  });
});
