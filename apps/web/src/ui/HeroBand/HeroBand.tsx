import type { HTMLAttributes } from 'react';
import { clsx } from '../../lib/clsx.js';
import styles from './HeroBand.module.css';

export type HeroBandTone = 'brand' | 'success' | 'error';

export interface HeroBandProps extends HTMLAttributes<HTMLDivElement> {
  /** Tints the layered gradient — 'brand' for identity/data screens,
   * 'success'/'error' for Result's two outcomes. */
  tone?: HeroBandTone;
}

/**
 * The one dominant visual anchor a screen gets (Design Spec redesign,
 * S1 Block 5): a layered-gradient surface reserved for the single most
 * important figure or statement on that screen — never more than one
 * per screen, which is what makes it read as a focal point rather than
 * another card. Every screen tints and fills it differently (Home's
 * greeting, Result's outcome, Progress's accuracy, Profile's
 * identity), but they all share this one structural surface, which is
 * what keeps the app feeling like one product instead of one-off
 * gradients per screen.
 */
export function HeroBand({ tone = 'brand', className, children, ...rest }: HeroBandProps) {
  return (
    <div className={clsx(styles.band, styles[tone], className)} {...rest}>
      {children}
    </div>
  );
}
