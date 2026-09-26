import { clsx } from '../../lib/clsx.js';
import { Icon } from '../Icon/Icon.js';
import type { IconName } from '../Icon/icons.js';
import type { SubjectGlyph } from '../../data/subjects.js';
import styles from './SubjectTile.module.css';

export interface SubjectTileProps {
  glyph: SubjectGlyph;
  color: string;
  size?: number;
  className?: string;
}

const glyphIcon: Partial<Record<SubjectGlyph, IconName>> = {
  globe: 'subjectEnglish',
  users: 'subjectSocial',
  code: 'subjectInformatics',
  atom: 'subjectPhysics',
  flask: 'subjectChemistry',
  leaf: 'subjectBiology',
  landmark: 'subjectHistory',
};

/**
 * The colored glyph tile used for every subject across the approved
 * design (S1 Block 6) — math/Russian render their literal character
 * (π, Aa), matching the screenshots exactly; the rest use the closest
 * outline icon from the shared set, since there's no clean way to
 * render "a globe" or "a robot" as a bare glyph.
 */
export function SubjectTile({ glyph, color, size = 44, className }: SubjectTileProps) {
  const iconName = glyphIcon[glyph];
  return (
    <span
      className={clsx(styles.tile, className)}
      style={{
        width: size,
        height: size,
        background: color,
        ['--tile-font-size' as string]: `${size * 0.5}px`,
      }}
      aria-hidden="true"
    >
      {glyph === 'pi' && <span className={styles.glyphText}>π</span>}
      {glyph === 'aa' && <span className={styles.glyphText}>Aa</span>}
      {iconName && <Icon name={iconName} size={Math.round(size * 0.52)} />}
    </span>
  );
}
