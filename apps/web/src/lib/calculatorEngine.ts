/**
 * Pure, framework-agnostic calculator core (Task Workspace block —
 * shared by the mobile bottom sheet and the desktop modal, never
 * duplicated per presentation). Builds a human-readable expression
 * string as the user taps keys, and evaluates it with a small
 * recursive-descent parser on "=" — never `eval()`, since that would
 * run arbitrary code for a string this component itself builds one
 * character at a time from a fixed key set, and there's no reason to
 * take that risk for four-function arithmetic.
 */

export type CalculatorKey =
  | `${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`
  | '.'
  | '+'
  | '-'
  | '×'
  | '÷'
  | '('
  | ')'
  | '='
  | 'AC'
  | '±'
  | '%';

export interface CalculatorState {
  /** What's shown as the "expression" line — the keys typed so far,
   * or (after "=") the expression that produced `result`. */
  expression: string;
  /** Set once "=" evaluates successfully; cleared by any further key
   * that starts building a new expression from scratch. */
  result: string | null;
  /** True when the expression is malformed (e.g. unmatched
   * parenthesis) or divides by zero — the display shows "Ошибка"
   * instead of a bogus number. */
  error: boolean;
}

export function initialCalculatorState(): CalculatorState {
  return { expression: '', result: null, error: false };
}

const DIGITS = new Set(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
const OPERATORS = new Set(['+', '-', '×', '÷']);

function lastToken(expression: string): string {
  const match = /(\d+\.?\d*|[+\-×÷().])$/.exec(expression);
  return match ? match[0] : '';
}

/** The number segment currently being typed — from the last operator/
 * paren/start of the expression up to the end — used by ± and %,
 * which act on "the number you just typed", not the whole expression.
 * Includes a leading "-" when it's a sign on this number (unary,
 * right after another operator/"(" or at the very start) rather than
 * the previous binary operator — otherwise ± on "-5" would negate the
 * "5" part only and produce "--5" instead of flipping back to "5". */
function currentNumberSegment(expression: string): { start: number; text: string } {
  let start = expression.length;
  while (start > 0 && /[\d.]/.test(expression[start - 1]!)) start--;
  if (start > 0 && expression[start - 1] === '-') {
    const before = expression[start - 2];
    if (before === undefined || OPERATORS.has(before) || before === '(') start--;
  }
  return { start, text: expression.slice(start) };
}

export function applyKey(state: CalculatorState, key: CalculatorKey): CalculatorState {
  if (key === 'AC') return initialCalculatorState();

  // Any key after a computed result starts fresh, except a digit/'('
  // continuing to build on the shown result would be surprising for a
  // simple four-function calculator — AC is the only explicit "clear".
  // A fresh digit after "=" starts a brand new expression; an operator
  // continues from the previous result (e.g. "12" "=" "+" "3" "=").
  if (state.result !== null && !state.error) {
    if (OPERATORS.has(key)) {
      return applyKeyToExpression({ expression: state.result, result: null, error: false }, key);
    }
    return applyKeyToExpression(initialCalculatorState(), key);
  }
  if (state.error) {
    if (key === '=') return state;
    return applyKeyToExpression(initialCalculatorState(), key);
  }
  return applyKeyToExpression(state, key);
}

function applyKeyToExpression(state: CalculatorState, key: CalculatorKey): CalculatorState {
  const { expression } = state;

  if (key === '=') {
    if (expression.trim() === '') return state;
    try {
      const value = evaluateExpression(expression);
      return { expression, result: formatNumber(value), error: false };
    } catch {
      return { expression, result: null, error: true };
    }
  }

  if (key === '±') {
    const { start, text } = currentNumberSegment(expression);
    if (text === '') return state;
    const negated = text.startsWith('-') ? text.slice(1) : `-${text}`;
    return { ...state, expression: expression.slice(0, start) + negated };
  }

  if (key === '%') {
    const { start, text } = currentNumberSegment(expression);
    if (text === '' || text === '-') return state;
    const asPercent = formatNumber(Number.parseFloat(text) / 100);
    return { ...state, expression: expression.slice(0, start) + asPercent };
  }

  if (DIGITS.has(key)) {
    const { text } = currentNumberSegment(expression);
    // No leading zeros ("00" -> "0"), and a segment already showing an
    // integer part is left alone rather than piling on more digits
    // after a leading zero (e.g. typing "0" then "5" gives "5", not "05").
    if (text === '0') {
      return { ...state, expression: expression.slice(0, -1) + key };
    }
    return { ...state, expression: expression + key };
  }

  if (key === '.') {
    const { text } = currentNumberSegment(expression);
    if (text.includes('.')) return state; // one decimal point per number
    return { ...state, expression: expression + (text === '' ? '0.' : '.') };
  }

  if (OPERATORS.has(key)) {
    const last = lastToken(expression);
    if (expression === '' && key !== '-') return state; // no leading + × ÷
    if (OPERATORS.has(last)) {
      // Replace a just-typed operator rather than stacking "12++".
      return { ...state, expression: expression.slice(0, -1) + key };
    }
    return { ...state, expression: expression + key };
  }

  if (key === '(') {
    const last = lastToken(expression);
    // An implicit "×" before "(" when it directly follows a number or
    // ")" — e.g. "2(3+4)" reads as "2×(3+4)", not a syntax error.
    const needsMultiply = /[\d)]/.test(last);
    return { ...state, expression: expression + (needsMultiply ? '×(' : '(') };
  }

  if (key === ')') {
    const open = (expression.match(/\(/g) ?? []).length;
    const close = (expression.match(/\)/g) ?? []).length;
    const last = lastToken(expression);
    if (open <= close || last === '' || OPERATORS.has(last) || last === '(') return state;
    return { ...state, expression: expression + ')' };
  }

  return state;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) throw new Error('not finite');
  // Round away float noise (0.1 + 0.2) at 10 significant decimal
  // places, then drop a trailing ".0" the way a real calculator would.
  const rounded = Number(value.toPrecision(12));
  return String(rounded);
}

/**
 * expr   := term (('+' | '-') term)*
 * term   := factor (('×' | '÷') factor)*
 * factor := '-' factor | number | '(' expr ')'
 */
function evaluateExpression(input: string): number {
  let pos = 0;

  function peek(): string | undefined {
    return input[pos];
  }

  function parseExpr(): number {
    let value = parseTerm();
    while (peek() === '+' || peek() === '-') {
      const op = input[pos++];
      const rhs = parseTerm();
      value = op === '+' ? value + rhs : value - rhs;
    }
    return value;
  }

  function parseTerm(): number {
    let value = parseFactor();
    while (peek() === '×' || peek() === '÷') {
      const op = input[pos++];
      const rhs = parseFactor();
      if (op === '÷') {
        if (rhs === 0) throw new Error('division by zero');
        value = value / rhs;
      } else {
        value = value * rhs;
      }
    }
    return value;
  }

  function parseFactor(): number {
    if (peek() === '-') {
      pos++;
      return -parseFactor();
    }
    if (peek() === '(') {
      pos++;
      const value = parseExpr();
      if (peek() !== ')') throw new Error('unmatched (');
      pos++;
      return value;
    }
    const match = /^\d+\.?\d*/.exec(input.slice(pos));
    if (!match) throw new Error('expected number at ' + pos);
    pos += match[0].length;
    return Number.parseFloat(match[0]);
  }

  const result = parseExpr();
  if (pos !== input.length) throw new Error('unexpected trailing input');
  return result;
}
