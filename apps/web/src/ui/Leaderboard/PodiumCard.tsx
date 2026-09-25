import { Icon } from '../Icon/Icon.js';
import { Avatar } from './Avatar.js';
import type { LeaderboardEntry } from '../../data/sampleLeaderboard.js';
import { clsx } from '../../lib/clsx.js';
import styles from './PodiumCard.module.css';

export function PodiumCard({ entry }: { entry: LeaderboardEntry }) {
  const isFirst = entry.rank === 1;
  return (
    <div className={clsx(styles.card, isFirst && styles.first)}>
      {isFirst && <Icon name="crown" size={22} className={styles.crownIcon} />}
      <span className={styles.rankBadge}>{entry.rank}</span>
      <Avatar username={entry.username} color={entry.avatarColor} size={isFirst ? 64 : 52} />
      <p className={clsx('text-body-sm', styles.username)}>{entry.username}</p>
      <p className={clsx('text-body', styles.xp)}>{entry.xp.toLocaleString('ru-RU')} XP</p>
      <div className={styles.stats}>
        <span>Решено: {entry.solved}</span>
        <span>Точность: {entry.accuracyPercent}%</span>
        <span>Серия: {entry.streakDays} дней</span>
      </div>
    </div>
  );
}
