import { useId, useState } from 'react';
import { clsx } from '../../lib/clsx.js';
import { BottomSheet } from '../BottomSheet/BottomSheet.js';
import { Icon } from '../Icon/Icon.js';
import styles from './Select.module.css';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  label?: string;
  options: readonly SelectOption[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  errorText?: string;
  helperText?: string;
  sheetTitle?: string;
}

/**
 * Select/dropdown (Design Spec Section 12). On mobile a native
 * `<select>` renders a tiny, hard-to-read system picker, so this opens
 * the shared BottomSheet with a full-width, touch-friendly option list
 * instead — the same pattern the spec calls for on filters and the
 * scratchboard.
 */
export function Select({
  label,
  options,
  value,
  onChange,
  placeholder = 'Выберите…',
  disabled = false,
  errorText,
  helperText,
  sheetTitle,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const triggerId = useId();
  const helperId = `${triggerId}-helper`;
  const hasError = Boolean(errorText);
  const helper = hasError ? errorText : helperText;
  const selected = options.find((option) => option.value === value);

  return (
    <div className={styles.field}>
      {label && (
        <label id={`${triggerId}-label`} className={clsx('text-label', styles.label)}>
          {label}
        </label>
      )}
      <button
        type="button"
        id={triggerId}
        className={clsx(styles.trigger, hasError && styles.error)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={label ? `${triggerId}-label ${triggerId}` : undefined}
        aria-describedby={helper ? helperId : undefined}
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <span className={clsx(!selected && styles.placeholder)}>
          {selected ? selected.label : placeholder}
        </span>
        <Icon name="chevronDown" size={18} className={styles.chevron} />
      </button>
      {helper && (
        <p
          id={helperId}
          className={clsx('text-body-sm', hasError ? styles.helperError : styles.helper)}
        >
          {helper}
        </p>
      )}

      <BottomSheet open={open} onClose={() => setOpen(false)} title={sheetTitle ?? label}>
        <div className={styles.optionList} role="listbox" aria-labelledby={`${triggerId}-label`}>
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={clsx(styles.option, isSelected && styles.optionSelected)}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                {option.label}
                {isSelected && <Icon name="check" size={18} />}
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </div>
  );
}
