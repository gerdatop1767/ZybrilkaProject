import { clsx } from '../../lib/clsx.js';
import styles from './Logo.module.css';

export type LogoIconVariant = 'desktop' | 'mobile';

export interface LogoProps {
  /** Rendered icon height in px. */
  size?: number;
  /** The approved package ships two distinct bison-icon crops — a
   * refined one for desktop headers, a simpler one for mobile — not a
   * single asset scaled between them. */
  icon?: LogoIconVariant;
  /** Hides the "Zybrilka" wordmark, e.g. where space is tight. */
  wordmark?: boolean;
  className?: string;
}

const iconSrc: Record<LogoIconVariant, string> = {
  desktop: '/branding/v2/logo-icon-desktop.png',
  mobile: '/branding/v2/logo-icon-mobile.png',
};

/**
 * The approved Zybrilka logo lockup (S1 Block 6 final design): the
 * bison-icon crop from the approved screenshots + a real "Zybrilka"
 * wordmark rendered as text (white "Zybr", gradient "ilka") — not an
 * image, since it's typography the browser can render natively.
 */
export function Logo({ size = 32, icon = 'desktop', wordmark = true, className }: LogoProps) {
  return (
    <span className={clsx(styles.lockup, className)}>
      <img
        src={iconSrc[icon]}
        alt={wordmark ? '' : 'Zybrilka'}
        height={size}
        width={size}
        className={styles.icon}
      />
      {wordmark && (
        <span className={styles.wordmark} style={{ fontSize: size * 0.62 }}>
          Zybr<span className={styles.wordmarkAccent}>ilka</span>
        </span>
      )}
    </span>
  );
}
