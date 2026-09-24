import type { HTMLAttributes, ReactNode } from 'react';
import { clsx } from '../../lib/clsx.js';
import styles from './motion.module.css';

interface MotionProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Stagger this entrance by N ms — small lists per the Design Spec's "staggered ~30-40ms" rule. */
  delayMs?: number;
}

function withDelay(delayMs?: number) {
  return delayMs ? { animationDelay: `${delayMs}ms` } : undefined;
}

/**
 * Lightweight entrance-motion primitives (Design Spec Section 6 / 13).
 * Thin CSS-animation wrappers, not an animation framework: each mount
 * plays its keyframe once and settles — there is no exit variant here
 * (Overlay/Toast own their own enter+exit transitions where that's
 * needed). All respect `prefers-reduced-motion` via tokens.css.
 */
export function FadeIn({ children, delayMs, className, style, ...rest }: MotionProps) {
  return (
    <div
      className={clsx(styles.fadeIn, className)}
      style={{ ...style, ...withDelay(delayMs) }}
      {...rest}
    >
      {children}
    </div>
  );
}

export function SlideUp({ children, delayMs, className, style, ...rest }: MotionProps) {
  return (
    <div
      className={clsx(styles.slideUp, className)}
      style={{ ...style, ...withDelay(delayMs) }}
      {...rest}
    >
      {children}
    </div>
  );
}

export function ScaleIn({ children, delayMs, className, style, ...rest }: MotionProps) {
  return (
    <div
      className={clsx(styles.scaleIn, className)}
      style={{ ...style, ...withDelay(delayMs) }}
      {...rest}
    >
      {children}
    </div>
  );
}

export interface CollapseProps {
  open: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Expand/collapse without measuring heights in JS: the CSS
 * `grid-template-rows: 0fr -> 1fr` technique animates to the content's
 * natural height directly.
 */
export function Collapse({ open, children, className }: CollapseProps) {
  return (
    <div
      className={clsx(styles.collapse, open && styles.collapseOpen, className)}
      aria-hidden={!open}
    >
      <div className={styles.collapseInner}>{children}</div>
    </div>
  );
}
