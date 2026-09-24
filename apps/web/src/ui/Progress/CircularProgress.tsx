import type { ReactNode } from 'react';
import { clsx } from '../../lib/clsx.js';
import styles from './CircularProgress.module.css';

export interface CircularProgressProps {
  /** 0-100. Omit and set `indeterminate` for an unknown-duration spinner. */
  value?: number;
  indeterminate?: boolean;
  variant?: 'default' | 'success' | 'error';
  size?: number;
  strokeWidth?: number;
  label?: string;
  /** Centered content, e.g. a mastery percentage or level number. */
  children?: ReactNode;
}

/**
 * Circular progress ring (Design Spec Section 12): mastery rings,
 * level indicators. Indeterminate mode rotates the whole ring instead
 * of animating stroke-dashoffset, matching the button/input spinners'
 * "spin" language.
 */
export function CircularProgress({
  value = 0,
  indeterminate = false,
  variant = 'default',
  size = 48,
  strokeWidth = 5,
  label,
  children,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, value));
  const offset = indeterminate
    ? circumference * 0.25
    : circumference - (clamped / 100) * circumference;

  return (
    <div
      style={{ position: 'relative', width: size, height: size }}
      role="progressbar"
      aria-label={label}
      aria-valuenow={indeterminate ? undefined : clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg
        width={size}
        height={size}
        className={clsx(styles.svg, indeterminate && styles.indeterminate)}
      >
        <circle
          className={styles.track}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className={clsx(styles.fill, variant !== 'default' && styles[variant])}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      {children && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
