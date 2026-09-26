import { useMemo, useState } from 'react';
import { subjects } from '../../data/subjects.js';
import { sampleTask } from '../../data/sampleTask.js';
import { useNavigation } from '../../lib/navigation.js';
import { leaderboard, currentUserEntry, totalParticipants } from '../../data/sampleLeaderboard.js';
import { Icon } from '../../ui/Icon/Icon.js';
import { StreakBadge } from '../../ui/RankBadge/StreakBadge.js';
import { Tabs } from '../../ui/Tabs/Tabs.js';
import { SubjectHeaderMobile } from '../../ui/SubjectHeader/SubjectHeaderMobile.js';
import { PodiumCard } from '../../ui/Leaderboard/PodiumCard.js';
import { Avatar } from '../../ui/Leaderboard/Avatar.js';
import { WipPlaceholder } from '../../ui/WipPlaceholder/WipPlaceholder.js';
import { SlideUp } from '../../ui/motion/motion.js';
import { clsx } from '../../lib/clsx.js';
import styles from './RatingMobile.module.css';

const viewTabs = [
  { id: 'overall', label: 'Общий' },
  { id: 'friends', label: 'Друзья' },
  { id: 'region', label: 'Мой регион' },
  { id: 'byTask', label: 'По заданиям' },
];

const periodTabs = [
  { id: 'week', label: 'За неделю' },
  { id: 'month', label: 'За месяц' },
  { id: 'all', label: 'За всё время' },
];

const periodMultiplier: Record<string, number> = { week: 0.15, month: 0.4, all: 1 };

/**
 * Mobile Рейтинг (S1 Block 6, approved design — mobile/10_rating.png):
 * top-3 podium + table, over the same canonical `data/
 * sampleLeaderboard.ts` the desktop screen renders. The period tabs
 * are a real (if simplified) control — XP scales by a period factor
 * rather than being purely decorative.
 */
export function RatingMobile() {
  const { back, navigate } = useNavigation();
  const subject = subjects.find((s) => s.id === sampleTask.subjectId) ?? subjects[0]!;
  const [view, setView] = useState('overall');
  const [period, setPeriod] = useState('week');

  const multiplier = periodMultiplier[period] ?? 1;
  const scaled = useMemo(
    () => leaderboard.map((entry) => ({ ...entry, xp: Math.round(entry.xp * multiplier) })),
    [multiplier],
  );
  const podium = [scaled[1]!, scaled[0]!, scaled[2]!];
  const rest = scaled.slice(3, 10);
  const scaledCurrentUser = {
    ...currentUserEntry,
    xp: Math.round(currentUserEntry.xp * multiplier),
  };

  return (
    <SlideUp className={styles.stack}>
      <SubjectHeaderMobile
        subject={subject}
        title="Рейтинг"
        onBack={back}
        trailing={
          <button type="button" aria-label="Награды" className={styles.trailingButton}>
            <Icon name="gift" size={20} />
          </button>
        }
      />

      <Tabs items={viewTabs} activeId={view} onChange={setView} aria-label="Раздел рейтинга" />

      {view !== 'overall' ? (
        <WipPlaceholder
          title={viewTabs.find((t) => t.id === view)!.label}
          note="Экран в разработке — следующий блок."
        />
      ) : (
        <>
          <Tabs
            items={periodTabs}
            activeId={period}
            onChange={setPeriod}
            aria-label="Период рейтинга"
          />

          <div className={styles.podiumRow}>
            {podium.map((entry) => (
              <PodiumCard key={entry.id} entry={entry} />
            ))}
          </div>

          <div className={styles.table}>
            <div className={styles.tableHeaderRow}>
              <span>#</span>
              <span>Пользователь</span>
              <span>XP</span>
              <span>Реш.</span>
              <span>Точн.</span>
              <span>Серия</span>
            </div>
            {rest.map((entry) => (
              <div key={entry.id} className={styles.row}>
                <span className={styles.rank}>{entry.rank}</span>
                <span className={styles.userCell}>
                  <Avatar username={entry.username} color={entry.avatarColor} size={28} />
                  <span className={styles.username}>{entry.username}</span>
                </span>
                <span>{entry.xp.toLocaleString('ru-RU')}</span>
                <span>{entry.solved}</span>
                <span>{entry.accuracyPercent}%</span>
                <span className={styles.streakCell}>
                  <StreakBadge days={entry.streakDays} size={16} lazy /> {entry.streakDays}
                </span>
              </div>
            ))}

            <p className={styles.ellipsisRow}>···</p>

            <div className={clsx(styles.row, styles.rowCurrentUser)}>
              <span className={styles.rank}>{scaledCurrentUser.rank}</span>
              <span className={styles.userCell}>
                <Avatar
                  username={scaledCurrentUser.username}
                  color={scaledCurrentUser.avatarColor}
                  size={28}
                />
                <span className={styles.username}>{scaledCurrentUser.username}</span>
              </span>
              <span>{scaledCurrentUser.xp.toLocaleString('ru-RU')}</span>
              <span>{scaledCurrentUser.solved}</span>
              <span>{scaledCurrentUser.accuracyPercent}%</span>
              <span className={styles.streakCell}>
                <StreakBadge days={scaledCurrentUser.streakDays} size={16} />{' '}
                {scaledCurrentUser.streakDays}
              </span>
            </div>
          </div>

          <p className="text-body-sm text-secondary" style={{ textAlign: 'center' }}>
            Из {totalParticipants.toLocaleString('ru-RU')} пользователей
          </p>

          <button
            type="button"
            className={styles.inviteCard}
            onClick={() => navigate({ screen: 'menu' })}
          >
            <span className={styles.inviteIcon}>
              <Icon name="friends" size={20} />
            </span>
            <span className={styles.inviteBody}>
              <p className="text-body" style={{ fontWeight: 700 }}>
                Пригласить друзей
              </p>
              <p className="text-body-sm text-secondary">
                Учитесь вместе и поднимайтесь в рейтинге
              </p>
            </span>
            <Icon name="chevronRight" size={18} />
          </button>
        </>
      )}
    </SlideUp>
  );
}
