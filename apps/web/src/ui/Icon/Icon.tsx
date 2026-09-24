import { icons, type IconName } from './icons.js';

export interface IconProps {
  name: IconName;
  size?: number;
  /** Filled/duotone look for active nav & selected states (Design Spec Section 3). */
  filled?: boolean;
  className?: string;
  'aria-label'?: string;
}

/**
 * Renders one icon from the shared registry. Outline by default; `filled`
 * switches to the filled treatment used for active navigation and
 * selected states, per the Design Specification's icon system.
 */
export function Icon({
  name,
  size = 24,
  filled = false,
  className,
  'aria-label': ariaLabel,
}: IconProps) {
  const Glyph = icons[name];
  return (
    <Glyph
      size={size}
      className={className}
      strokeWidth={filled ? 1.5 : 1.75}
      fill={filled ? 'currentColor' : 'none'}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
    />
  );
}
