import { useRef, useState } from 'react';
import { Icon } from '../Icon/Icon.js';
import { Collapse } from '../motion/motion.js';
import { clsx } from '../../lib/clsx.js';
import { mathKeyboardGroups } from './mathKeyboardKeys.js';
import { insertAtCursor } from './insertAtCursor.js';
import styles from './MathAnswerField.module.css';

export interface MathAnswerFieldProps {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Input for ONE final answer value (e.g. "-4π; -3π; -8π/3", "√3",
 * "1/2") with an optional on-screen math-symbol panel — NOT a
 * solution/step editor. A single `<input type="text">` underneath, so
 * normal typing, the system keyboard, paste, and the existing
 * `checkAnswer`/`submitAttempt` flow all keep working exactly as
 * before; the math panel only ever inserts plain text (no LaTeX) at
 * the cursor position into that same input (see `mathKeyboardKeys.ts`
 * for why each key's `insert` value is plain-text-checker-safe).
 *
 * One component for both desktop and mobile — responsive layout is
 * CSS-only (`MathAnswerField.module.css`), so there is no
 * `MobileAnswerInput`/`DesktopAnswerInput` split to keep in sync as
 * more tasks (№14-19) get wired up.
 */
export function MathAnswerField({
  value,
  onChange,
  ariaLabel,
  placeholder,
  disabled,
  className,
}: MathAnswerFieldProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleKeyPress(insert: string, cursorOffsetFromEnd: number) {
    const el = inputRef.current;
    const { value: next, cursor } = insertAtCursor(value, el, insert, cursorOffsetFromEnd);
    onChange(next);
    // The input's own re-render hasn't happened yet inside this handler
    // (React batches the `onChange` state update), so restoring the
    // selection has to wait a tick — otherwise `setSelectionRange`
    // would apply to the old, pre-insert value and land in the wrong
    // spot once the new value commits.
    requestAnimationFrame(() => {
      el?.setSelectionRange(cursor, cursor);
      el?.focus();
    });
  }

  return (
    <div className={clsx(styles.wrap, className)}>
      <div className={styles.row}>
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          aria-label={ariaLabel}
        />
        <button
          type="button"
          className={clsx(styles.fxButton, panelOpen && styles.fxButtonActive)}
          aria-pressed={panelOpen}
          aria-label="Математические символы"
          // Keeps focus (and the cursor position) on the input instead
          // of moving it to this button — otherwise every keyboard
          // insert would land at the end of the value instead of where
          // the user was actually typing (see section 7 of the spec:
          // backspace/cursor/insert-in-the-middle must keep working).
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setPanelOpen((v) => !v)}
        >
          <Icon name="fxInput" size={18} />
        </button>
      </div>
      <Collapse open={panelOpen}>
        <div className={styles.panel}>
          {mathKeyboardGroups.map((group) => (
            <div key={group.id} className={styles.keyRow}>
              {group.keys.map((key) => (
                <button
                  key={key.id}
                  type="button"
                  className={styles.key}
                  aria-label={key.ariaLabel ?? key.label}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleKeyPress(key.insert, key.cursorOffsetFromEnd ?? 0)}
                >
                  {key.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      </Collapse>
    </div>
  );
}
