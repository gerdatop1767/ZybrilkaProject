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
 * NOT USED in any live screen as of Block 4: the approved Zybrilka
 * logo (see ui/Logo) is now the app's real brand element, and the
 * animated mascot direction was explicitly dropped. This component is
 * kept dormant, unimported by any screen, purely as a reference for a
 * possible future mascot experiment — it must not affect current UI.
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
