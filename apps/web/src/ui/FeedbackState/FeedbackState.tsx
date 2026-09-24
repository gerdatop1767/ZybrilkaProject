import type { ReactNode } from 'react';
import { clsx } from '../../lib/clsx.js';
import { Icon } from '../Icon/Icon.js';
import type { IconName } from '../Icon/icons.js';
import styles from './FeedbackState.module.css';

export type FeedbackVariant = 'success' | 'error' | 'warning' | 'info';

export interface FeedbackStateProps {
  variant: FeedbackVariant;
  title: string;
  description?: ReactNode;
  className?: string;
}

const variantIcon: Record<FeedbackVariant, IconName> = {
  success: 'success',
  error: 'errorCircle',
  warning: 'warning',
  info: 'info',
};

/**
 * Inline feedback state (Design Spec Section 6 / 12): the correct/
 * incorrect banner on a result card, a form-level error, a warning or
 * info note. `error` uses a softer tint than `success` on purpose — an
 * incorrect answer must never feel aggressive or humiliating. Settles
 * in with a short fade/rise, never a bounce or shake.
 */
export function FeedbackState({ variant, title, description, className }: FeedbackStateProps) {
  return (
    <div className={clsx(styles.feedback, styles[variant], className)} role="status">
      <span className={styles.icon}>
        <Icon name={variantIcon[variant]} size={22} />
      </span>
      <div className={styles.content}>
        <p className="text-h3">{title}</p>
        {description && <p className="text-body-sm text-secondary">{description}</p>}
      </div>
    </div>
  );
}
