import { clsx } from '../../lib/clsx.js';
import styles from './ProgressBar.module.css';

export interface ProgressBarProps {
  /** 0-100. Omit and set `indeterminate` for an unknown-duration loading bar. */
  value?: number;
  indeterminate?: boolean;
  variant?: 'default' | 'success' | 'error';
  large?: boolean;
  label?: string;
  className?: string;
}

/**
 * Linear progress bar (Design Spec Section 12): XP/level fill, task
 * progress, upload/loading state. Value changes animate smoothly via a
 * CSS `width` transition rather than any JS-driven animation loop.
 */
export function ProgressBar({
  value = 0,
  indeterminate = false,
  variant = 'default',
  large = false,
  label,
  className,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      className={clsx(
        styles.track,
        large && styles.large,
        variant !== 'default' && styles[variant],
        indeterminate && styles.indeterminate,
        className,
      )}
      role="progressbar"
      aria-label={label}
      aria-valuenow={indeterminate ? undefined : clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={styles.fill} style={indeterminate ? undefined : { width: `${clamped}%` }} />
    </div>
  );
}
