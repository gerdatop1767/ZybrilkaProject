import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx } from '../../lib/clsx.js';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  loading?: boolean;
  children: ReactNode;
}

/**
 * Base button from the Zybrilka design system (Design Spec Section 3 / 12).
 * Variants: primary (main CTA), secondary (outline), ghost (link-style),
 * destructive (confirm-step only). Disabled and loading states are built
 * in so screens never hand-roll their own button chrome.
 */
export function Button({
  variant = 'primary',
  fullWidth = false,
  loading = false,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={clsx(
        styles.button,
        styles[variant],
        fullWidth && styles.fullWidth,
        loading && styles.loading,
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {children}
      {loading && <span className={styles.spinner} aria-hidden="true" />}
    </button>
  );
}
