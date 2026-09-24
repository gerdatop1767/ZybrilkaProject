import type { HTMLAttributes } from 'react';
import { clsx } from '../../lib/clsx.js';
import styles from './Card.module.css';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Raised surface for modals/sheets/nested emphasis (Design Spec Section 3). */
  elevated?: boolean;
  /** Adds the press feedback for a tappable card (e.g. a list item). */
  interactive?: boolean;
}

/**
 * Base card from the Zybrilka design system (Design Spec Section 3 / 12).
 * Task, progress, achievement, recommendation, battle and mistake cards
 * are specialized layouts built on top of this base in later S1 blocks.
 */
export function Card({
  elevated = false,
  interactive = false,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={clsx(
        styles.card,
        elevated && styles.elevated,
        interactive && styles.interactive,
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
