import { clsx } from '../../lib/clsx.js';
import styles from './Mascot.module.css';

/**
 * The 15 poses defined in the approved Design Specification's mascot
 * animation library (Sections 5 & 17 of the spec). Kept here as the
 * single source of truth for valid pose names, even before real assets
 * exist, so screens already call the component the way they will once
 * assets land.
 */
export type MascotPose =
  | 'idle'
  | 'greeting'
  | 'happy'
  | 'thinking'
  | 'encouraging'
  | 'correct'
  | 'incorrect'
  | 'celebrating'
  | 'streak'
  | 'achievement'
  | 'loading'
  | 'empty'
  | 'battleCountdown'
  | 'battleVictory'
  | 'battleDefeat';

export interface MascotProps {
  pose: MascotPose;
  size?: number;
  className?: string;
}

/**
 * Mascot placeholder (Design Spec Sections 5 & 17).
 *
 * IMPORTANT: the approved mascot character (an exact reference image
 * and 15 Higgsfield-generated pose clips) is not yet committed to this
 * repository. Per instructions, this component does NOT invent or
 * redraw a mascot — it renders a neutral placeholder that carries the
 * right pose/size/position contract, so screens can call `<Mascot
 * pose="..." />` in their final spots now and swap in the real
 * asset (an image/video/Lottie keyed by `pose`) later without any
 * screen-level changes. No Higgsfield credits are spent by this
 * component.
 */
export function Mascot({ pose, size = 56, className }: MascotProps) {
  return (
    <div
      className={clsx(styles.mascot, className)}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      role="img"
      aria-label="Zybrilka"
      data-mascot-pose={pose}
    >
      <span className={styles.glyph} aria-hidden="true">
        Z
      </span>
    </div>
  );
}
