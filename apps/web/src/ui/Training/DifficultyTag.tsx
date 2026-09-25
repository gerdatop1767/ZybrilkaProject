import { Icon } from '../Icon/Icon.js';
import { clsx } from '../../lib/clsx.js';
import type { SampleTask } from '../../data/sampleTask.js';
import styles from './DifficultyTag.module.css';

export type DifficultyLabel = SampleTask['difficultyLabel'];

const toneByLabel: Record<DifficultyLabel, 'green' | 'blue' | 'red'> = {
  Лёгкое: 'green',
  Среднее: 'blue',
  Сложное: 'red',
};

/**
 * The colored difficulty pill used throughout Training/Result (S1
 * Block 6): "Лёгкое"/"Среднее"/"Сложное" — green/blue/red, matching
 * the approved screenshots' difficulty-chip colors exactly, reused
 * everywhere a task variant shows its difficulty.
 */
export function DifficultyTag({ label }: { label: DifficultyLabel }) {
  return (
    <span className={clsx(styles.tag, styles[toneByLabel[label]])}>
      <Icon name="progress" size={12} />
      {label}
    </span>
  );
}
