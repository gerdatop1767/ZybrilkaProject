import { clsx } from '../../lib/clsx.js';
import styles from './Logo.module.css';

export interface LogoProps {
  /** Rendered height in px; width follows the asset's own 332:291 ratio. */
  size?: number;
  className?: string;
}

/**
 * The approved Zybrilka logo (apps/web/public/branding/zybrilka-logo.png)
 * — the exact asset provided, used as-is. Not redrawn, not recreated
 * with HTML/CSS, not replaced with an icon. This is now the product's
 * main visual brand element, replacing the earlier Mascot placeholder
 * in the visible UI (see ui/Mascot for why that component still exists
 * but is no longer rendered anywhere).
 */
export function Logo({ size = 32, className }: LogoProps) {
  return (
    <img
      src="/branding/zybrilka-logo.png"
      alt="Zybrilka"
      height={size}
      className={clsx(styles.logo, className)}
    />
  );
}
