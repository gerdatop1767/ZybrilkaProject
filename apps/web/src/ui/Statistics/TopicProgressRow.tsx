import { Icon } from '../Icon/Icon.js';
import type { IconName } from '../Icon/icons.js';
import styles from './TopicProgressRow.module.css';

export interface TopicProgressRowProps {
  icon: IconName;
  topic: string;
  masteryPercent: number;
  onSelect?: () => void;
}

/**
 * "Прогресс по темам" row (mobile Statistics): icon tile, thin
 * progress bar, percent and a chevron — a real tappable row, opening
 * the topic-scoped training flow.
 */
export function TopicProgressRow({ icon, topic, masteryPercent, onSelect }: TopicProgressRowProps) {
  return (
    <button type="button" className={styles.row} onClick={onSelect}>
      <span className={styles.iconTile}>
        <Icon name={icon} size={18} />
      </span>
      <span className={styles.body}>
        <span className={styles.label}>{topic}</span>
        <span
          className={styles.track}
          role="progressbar"
          aria-label={topic}
          aria-valuenow={masteryPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span className={styles.fill} style={{ width: `${masteryPercent}%` }} />
        </span>
      </span>
      <span className={styles.percent}>{masteryPercent}%</span>
      <Icon name="chevronRight" size={16} />
    </button>
  );
}
