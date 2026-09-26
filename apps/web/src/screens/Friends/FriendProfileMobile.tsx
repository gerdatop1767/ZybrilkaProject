import { getFriendById, friends } from '../../data/sampleFriends.js';
import { useNavigation } from '../../lib/navigation.js';
import { Card } from '../../ui/Card/Card.js';
import { Icon } from '../../ui/Icon/Icon.js';
import { Avatar } from '../../ui/Leaderboard/Avatar.js';
import { ProgressBar } from '../../ui/Progress/ProgressBar.js';
import { StreakBadge } from '../../ui/RankBadge/StreakBadge.js';
import { LevelBadge } from '../../ui/RankBadge/LevelBadge.js';
import { FadeIn, ScaleIn } from '../../ui/motion/motion.js';
import { WipPlaceholder } from '../../ui/WipPlaceholder/WipPlaceholder.js';
import styles from './FriendProfileMobile.module.css';

export interface FriendProfileMobileProps {
  friendId: string;
}

/** Mobile friend profile (/friends/:id) — same data as FriendProfileDesktop,
 * stacked into a single column, with the same custom back-header pattern
 * used by FriendsMobile/HelpMobile. */
export function FriendProfileMobile({ friendId }: FriendProfileMobileProps) {
  const { back } = useNavigation();
  const friend = getFriendById(friendId);

  if (!friend) {
    return (
      <div className={styles.stack}>
        <div className={styles.header}>
          <button type="button" className={styles.backButton} aria-label="Назад" onClick={back}>
            <Icon name="back" size={20} />
          </button>
          <p className="text-body" style={{ fontWeight: 700 }}>
            Друзья
          </p>
        </div>
        <WipPlaceholder title="Друг не найден" note="Такого пользователя нет в списке друзей." />
      </div>
    );
  }

  const rank = [...friends].sort((a, b) => b.xp - a.xp).findIndex((f) => f.id === friend.id) + 1;

  return (
    <FadeIn className={styles.stack}>
      <div className={styles.header}>
        <button type="button" className={styles.backButton} aria-label="Назад" onClick={back}>
          <Icon name="back" size={20} />
        </button>
        <p className="text-body" style={{ fontWeight: 700 }}>
          Друзья
        </p>
      </div>

      <Card className={styles.hero}>
        <ScaleIn className={styles.heroTop}>
          <Avatar
            username={friend.username}
            color={friend.avatarColor}
            avatarUrl={friend.avatarUrl}
            size={64}
          />
          <div>
            <h1 className="text-h2">{friend.username}</h1>
            {friend.online ? (
              <span className={styles.onlineBadge}>
                <span className={styles.onlineDot} aria-hidden="true" /> Онлайн
              </span>
            ) : (
              <span className="text-body-sm text-secondary">{friend.lastSeen}</span>
            )}
          </div>
        </ScaleIn>
        <p className="text-body-sm text-secondary">В друзьях с {friend.friendsSince}</p>
        <div className={styles.badgeRow}>
          <FadeIn delayMs={40} className={styles.badgeChip}>
            <LevelBadge level={friend.level} size={24} />
            <span>
              <p className="text-body-sm text-secondary">Уровень</p>
              <p className="text-body" style={{ fontWeight: 700 }}>
                {friend.level}
              </p>
            </span>
          </FadeIn>
          <FadeIn delayMs={80} className={styles.badgeChip}>
            <StreakBadge days={friend.streakDays} size={24} />
            <span>
              <p className="text-body-sm text-secondary">Серия</p>
              <p className="text-body" style={{ fontWeight: 700 }}>
                {friend.streakDays} дней
              </p>
            </span>
          </FadeIn>
          <FadeIn delayMs={120} className={styles.badgeChip}>
            <span className={styles.xpIcon}>
              <Icon name="star" size={20} />
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
              <Icon name="crown" size={20} />
            </span>
            <span>
              <p className="text-body-sm text-secondary">Место среди друзей</p>
              <p className="text-body" style={{ fontWeight: 700 }}>
                #{rank}
              </p>
            </span>
          </FadeIn>
        </div>
      </Card>

      <div className={styles.statsRow}>
        <Card className={styles.statCard}>
          <p className="text-h3">{friend.solved.toLocaleString('ru-RU')}</p>
          <p className="text-body-sm text-secondary">решено</p>
        </Card>
        <Card className={styles.statCard}>
          <p className="text-h3">{friend.accuracyPercent}%</p>
          <p className="text-body-sm text-secondary">точность</p>
        </Card>
        <Card className={styles.statCard}>
          <p className="text-h3">{friend.mutualFriends}</p>
          <p className="text-body-sm text-secondary">общих</p>
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
                <span className="text-body-sm" style={{ width: '7rem', flexShrink: 0 }}>
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
