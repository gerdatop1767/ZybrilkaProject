import { getFriendById, friends } from '../../data/sampleFriends.js';
import { BackRow } from '../../ui/BackRow/BackRow.js';
import { Card } from '../../ui/Card/Card.js';
import { Icon } from '../../ui/Icon/Icon.js';
import { Avatar } from '../../ui/Leaderboard/Avatar.js';
import { ProgressBar } from '../../ui/Progress/ProgressBar.js';
import { StreakBadge } from '../../ui/RankBadge/StreakBadge.js';
import { LevelBadge } from '../../ui/RankBadge/LevelBadge.js';
import { FadeIn, ScaleIn } from '../../ui/motion/motion.js';
import { WipPlaceholder } from '../../ui/WipPlaceholder/WipPlaceholder.js';
import styles from './FriendProfileDesktop.module.css';

export interface FriendProfileDesktopProps {
  friendId: string;
}

/**
 * Desktop friend profile (/friends/:id) — the drill-down BackRow
 * explicitly returns to "Друзья" (never a stale underlying tab), per
 * the same fix already applied to the other sidebar-reachable screens.
 */
export function FriendProfileDesktop({ friendId }: FriendProfileDesktopProps) {
  const friend = getFriendById(friendId);

  if (!friend) {
    return (
      <div>
        <BackRow to={{ screen: 'friends' }} label="Друзья" />
        <WipPlaceholder title="Друг не найден" note="Такого пользователя нет в списке друзей." />
      </div>
    );
  }

  const rank = [...friends].sort((a, b) => b.xp - a.xp).findIndex((f) => f.id === friend.id) + 1;

  return (
    <FadeIn className={styles.page}>
      <BackRow to={{ screen: 'friends' }} label="Друзья" />

      <Card className={styles.hero}>
        <ScaleIn>
          <Avatar
            username={friend.username}
            color={friend.avatarColor}
            avatarUrl={friend.avatarUrl}
            size={72}
          />
        </ScaleIn>
        <div className={styles.heroBody}>
          <div className={styles.nameRow}>
            <h1 className="text-h1">{friend.username}</h1>
            {friend.online ? (
              <span className={styles.onlineBadge}>
                <span className={styles.onlineDot} aria-hidden="true" /> Онлайн
              </span>
            ) : (
              <span className="text-body-sm text-secondary">{friend.lastSeen}</span>
            )}
          </div>
          <p className="text-body-sm text-secondary">В друзьях с {friend.friendsSince}</p>
          <div className={styles.badgeRow}>
            <FadeIn delayMs={40} className={styles.badgeChip}>
              <LevelBadge level={friend.level} size={28} />
              <span>
                <p className="text-body-sm text-secondary">Уровень</p>
                <p className="text-body" style={{ fontWeight: 700 }}>
                  {friend.level}
                </p>
              </span>
            </FadeIn>
            <FadeIn delayMs={80} className={styles.badgeChip}>
              <StreakBadge days={friend.streakDays} size={28} />
              <span>
                <p className="text-body-sm text-secondary">Серия</p>
                <p className="text-body" style={{ fontWeight: 700 }}>
                  {friend.streakDays} дней
                </p>
              </span>
            </FadeIn>
            <FadeIn delayMs={120} className={styles.badgeChip}>
              <span className={styles.xpIcon}>
                <Icon name="star" size={22} />
              </span>
              <span>
                <p className="text-body-sm text-secondary">XP</p>
                <p className="text-body" style={{ fontWeight: 700 }}>
                  {friend.xp.toLocaleString('ru-RU')}
                </p>
              </span>
            </FadeIn>
            <FadeIn delayMs={160} className={styles.badgeChip}>
              <span className={styles.xpIcon}>
                <Icon name="crown" size={22} />
              </span>
              <span>
                <p className="text-body-sm text-secondary">Место среди друзей</p>
                <p className="text-body" style={{ fontWeight: 700 }}>
                  #{rank}
                </p>
              </span>
            </FadeIn>
          </div>
        </div>
      </Card>

      <div className={styles.statsRow}>
        <Card className={styles.statCard}>
          <p className="text-h2">{friend.solved.toLocaleString('ru-RU')}</p>
          <p className="text-body-sm text-secondary">заданий решено</p>
        </Card>
        <Card className={styles.statCard}>
          <p className="text-h2">{friend.accuracyPercent}%</p>
          <p className="text-body-sm text-secondary">правильных ответов</p>
        </Card>
        <Card className={styles.statCard}>
          <p className="text-h2">{friend.mutualFriends}</p>
          <p className="text-body-sm text-secondary">общих друзей</p>
        </Card>
      </div>

      <Card>
        <p className="text-h3">Статистика по предметам</p>
        {friend.subjects.length === 0 ? (
          <p className="text-body-sm text-secondary" style={{ marginTop: 'var(--space-2)' }}>
            Пока нет данных по предметам.
          </p>
        ) : (
          <div className={styles.subjectList} style={{ marginTop: 'var(--space-3)' }}>
            {friend.subjects.map((s, index) => (
              <FadeIn key={s.subjectId} delayMs={index * 40} className={styles.subjectRow}>
                <span className="text-body-sm" style={{ width: '10rem', flexShrink: 0 }}>
                  {s.subjectName}
                </span>
                <ProgressBar value={s.accuracyPercent} className={styles.subjectBar} />
                <span className={styles.subjectPercent}>{s.accuracyPercent}%</span>
              </FadeIn>
            ))}
          </div>
        )}
      </Card>
    </FadeIn>
  );
}
