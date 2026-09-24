import { clsx } from '../../lib/clsx.js';
import styles from './SectionHeader.module.css';

export interface SectionHeaderProps {
  /** Small uppercase label above the title, e.g. "СЕГОДНЯ" — the accent color, not gray. */
  eyebrow?: string;
  title: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

/**
 * Section header (Design Spec Section 3 / 12): an eyebrow label +
 * title pair, used above every card group instead of a bare `text-h3`.
 * The single structural fix for "everything looks like the same gray
 * card": a consistent, distinctive hierarchy above each section rather
 * than a title that reads at the same weight as its content.
 */
export function SectionHeader({ eyebrow, title, action, className }: SectionHeaderProps) {
  return (
    <div className={clsx(styles.header, className)}>
      <div className={styles.text}>
        {eyebrow && <span className={clsx('text-label', styles.eyebrow)}>{eyebrow}</span>}
        <h2 className="text-h3">{title}</h2>
      </div>
      {action && (
        <button type="button" className={styles.action} onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}
