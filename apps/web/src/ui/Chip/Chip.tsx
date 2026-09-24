import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
import { clsx } from '../../lib/clsx.js';
import { Icon } from '../Icon/Icon.js';
import type { IconName } from '../Icon/icons.js';
import styles from './Chip.module.css';

export interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  selected?: boolean;
  icon?: IconName;
  /** A small color dot, e.g. a subject's fixed hue (Design Spec Section 2). */
  accentColor?: string;
  children: ReactNode;
}

/**
 * Toggleable chip used for subject/topic/difficulty/task-number filters
 * (Design Spec Section 12). A plain toggle button under the hood —
 * `aria-pressed` communicates selection to assistive tech.
 */
export function Chip({
  selected = false,
  icon,
  accentColor,
  className,
  children,
  style,
  ...rest
}: ChipProps) {
  const chipStyle: CSSProperties = accentColor
    ? { ...style, ['--chip-accent' as string]: accentColor }
    : (style ?? {});

  return (
    <button
      type="button"
      className={clsx(styles.chip, selected && styles.selected, className)}
      aria-pressed={selected}
      style={chipStyle}
      {...rest}
    >
      {accentColor && !selected && <span className={styles.dot} aria-hidden="true" />}
      {icon && <Icon name={icon} size={16} />}
      {children}
    </button>
  );
}
