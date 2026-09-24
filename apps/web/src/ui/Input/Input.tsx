import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { clsx } from '../../lib/clsx.js';
import { Icon } from '../Icon/Icon.js';
import type { IconName } from '../Icon/icons.js';
import styles from './Input.module.css';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label?: string;
  helperText?: string;
  /** Replaces helperText with an error message and switches to the error state. */
  errorText?: string;
  leadingIcon?: IconName;
  trailingIcon?: IconName;
  /** Shows a spinner in place of the trailing icon (e.g. async validation). */
  loading?: boolean;
  wrapperClassName?: string;
}

/**
 * Base text input from the Zybrilka design system (Design Spec Section 12).
 * States: default, focused (native `:focus-within`), filled (native
 * value), error, disabled and read-only all come from standard HTML/CSS
 * rather than extra JS state, so the component stays a thin, predictable
 * wrapper.
 */
export function Input({
  label,
  helperText,
  errorText,
  leadingIcon,
  trailingIcon,
  loading = false,
  disabled,
  id,
  wrapperClassName,
  ...rest
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperId = `${inputId}-helper`;
  const hasError = Boolean(errorText);
  const helper: ReactNode = hasError ? errorText : helperText;

  return (
    <div className={clsx(styles.field, wrapperClassName)}>
      {label && (
        <label htmlFor={inputId} className={clsx('text-label', styles.label)}>
          {label}
        </label>
      )}
      <div
        className={clsx(styles.inputWrap, hasError && styles.error, disabled && styles.disabled)}
      >
        {leadingIcon && (
          <span className={styles.icon}>
            <Icon name={leadingIcon} size={18} />
          </span>
        )}
        <input
          {...rest}
          id={inputId}
          disabled={disabled}
          className={styles.input}
          aria-invalid={hasError || undefined}
          aria-describedby={helper ? helperId : undefined}
        />
        {loading ? (
          <span className={clsx(styles.icon, styles.spinner)}>
            <Icon name="spinner" size={18} />
          </span>
        ) : (
          trailingIcon && (
            <span className={styles.icon}>
              <Icon name={trailingIcon} size={18} />
            </span>
          )
        )}
      </div>
      {helper && (
        <p
          id={helperId}
          className={clsx('text-body-sm', hasError ? styles.helperError : styles.helper)}
        >
          {helper}
        </p>
      )}
    </div>
  );
}
