import { useState, type ReactNode } from 'react';
import { Icon } from '../Icon/Icon.js';
import styles from './MistakeNumberGroup.module.css';

function pluralizeMistakes(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) return 'ошибок';
  if (mod10 === 1) return 'ошибка';
  if (mod10 >= 2 && mod10 <= 4) return 'ошибки';
  return 'ошибок';
}

export interface MistakeNumberGroupProps {
  taskNumber: number;
  count: number;
  children: ReactNode;
  /** Groups start expanded so the list reads exactly like before for a
   * small number of mistakes — collapsing is an option, not a default
   * that would hide content the user hasn't asked to hide. */
  defaultExpanded?: boolean;
}

/**
 * "№17 — 2 ошибки" group header for the Мои ошибки list (desktop +
 * mobile): the task number is the primary visual element, the real
 * mistake count comes straight from `mistakes` (never invented), and
 * the body collapses to keep a long list compact.
 */
export function MistakeNumberGroup({
  taskNumber,
  count,
  children,
  defaultExpanded = true,
}: MistakeNumberGroupProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className={styles.group}>
      <button
        type="button"
        className={styles.header}
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
      >
        <span className={styles.number}>№{taskNumber}</span>
        <span className={styles.count}>
          {count} {pluralizeMistakes(count)}
        </span>
        <Icon
          name="chevronRight"
          size={18}
          className={expanded ? styles.chevronExpanded : styles.chevron}
        />
      </button>
      {expanded && <div className={styles.body}>{children}</div>}
    </div>
  );
}
