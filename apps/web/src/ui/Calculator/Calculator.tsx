import { useState } from 'react';
import {
  applyKey,
  initialCalculatorState,
  type CalculatorKey,
} from '../../lib/calculatorEngine.js';
import { clsx } from '../../lib/clsx.js';
import styles from './Calculator.module.css';

interface KeyDef {
  key: CalculatorKey | 'AC';
  label: string;
  variant?: 'op' | 'accent' | 'equals';
}

const KEYS: readonly KeyDef[] = [
  { key: 'AC', label: 'AC', variant: 'op' },
  { key: '(', label: '(', variant: 'op' },
  { key: ')', label: ')', variant: 'op' },
  { key: '÷', label: '÷', variant: 'accent' },
  { key: '7', label: '7' },
  { key: '8', label: '8' },
  { key: '9', label: '9' },
  { key: '×', label: '×', variant: 'accent' },
  { key: '4', label: '4' },
  { key: '5', label: '5' },
  { key: '6', label: '6' },
  { key: '-', label: '−', variant: 'accent' },
  { key: '1', label: '1' },
  { key: '2', label: '2' },
  { key: '3', label: '3' },
  { key: '+', label: '+', variant: 'accent' },
  { key: '±', label: '±', variant: 'op' },
  { key: '0', label: '0' },
  { key: '.', label: ',' },
  { key: '=', label: '=', variant: 'equals' },
];

/**
 * The calculator's shared core (Task Workspace block 3): display +
 * button grid, used identically by CalculatorModal (desktop) and
 * CalculatorSheet (mobile) — only their surrounding chrome differs.
 * Owns its own display state entirely separately from the task's
 * answer field, so opening/closing it never touches what the user has
 * typed as their actual answer.
 */
export function Calculator() {
  const [state, setState] = useState(initialCalculatorState());

  function press(key: CalculatorKey) {
    setState((prev) => applyKey(prev, key));
  }

  const displayValue = state.error
    ? 'Ошибка'
    : (state.result ?? (state.expression === '' ? '0' : state.expression));
  const showExpressionLine = state.result !== null && !state.error;

  return (
    <div className={styles.calculator}>
      <div className={styles.display}>
        {showExpressionLine && <span className={styles.expressionLine}>{state.expression}</span>}
        <span
          className={clsx(styles.resultLine, state.error && styles.resultError)}
          data-testid="calculator-display"
        >
          {displayValue}
        </span>
      </div>
      <div className={styles.percentRow}>
        <button
          type="button"
          className={styles.percentButton}
          onClick={() => press('%')}
          aria-label="Процент"
        >
          %
        </button>
      </div>
      <div className={styles.grid}>
        {KEYS.map(({ key, label, variant }) => (
          <button
            key={key}
            type="button"
            className={clsx(
              styles.key,
              variant === 'op' && styles.keyOp,
              variant === 'accent' && styles.keyAccent,
              variant === 'equals' && styles.keyEquals,
            )}
            onClick={() => press(key as CalculatorKey)}
            aria-label={key === '.' ? 'Точка' : key === '-' ? 'Минус' : label}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
