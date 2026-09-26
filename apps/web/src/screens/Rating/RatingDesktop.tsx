import { useMemo, useState } from 'react';
import { subjects } from '../../data/subjects.js';
import {
  leaderboard,
  currentUserEntry,
  totalParticipants,
  weeklyLeaders,
  subjectLeaders,
  getSubjectLeaderboard,
  friendsLeaderboard,
  currentUserFriendEntry,
  type LeaderboardEntry,
} from '../../data/sampleLeaderboard.js';
import { userStats } from '../../data/sampleProgress.js';
import { Card } from '../../ui/Card/Card.js';
import { Chip } from '../../ui/Chip/Chip.js';
import { Select } from '../../ui/Select/Select.js';
import { Icon } from '../../ui/Icon/Icon.js';
import { Avatar } from '../../ui/Leaderboard/Avatar.js';
import { StreakBadge } from '../../ui/RankBadge/StreakBadge.js';
import { LevelBadge } from '../../ui/RankBadge/LevelBadge.js';
import { BackRow } from '../../ui/BackRow/BackRow.js';
import { FadeIn } from '../../ui/motion/motion.js';
import { clsx } from '../../lib/clsx.js';
import styles from './RatingDesktop.module.css';

const viewTabs = [
  { id: 'overall', label: 'Общий рейтинг', icon: 'friends' as const },
  { id: 'bySubject', label: 'По предметам', icon: 'progress' as const },
  { id: 'friends', label: 'Среди друзей', icon: 'friends' as const },
];

const periodOptions = [
  { value: 'all', label: 'Все время' },
  { value: 'month', label: 'За месяц' },
  { value: 'week', label: 'За неделю' },
];

const medalColor: Record<number, string> = {
  1: 'var(--color-gold)',
  2: 'var(--color-text-secondary)',
  3: '#cd7f32',
};

/**
 * Desktop Рейтинг (S1 Block 6, approved design — desktop/10_rating.png):
 * a real leaderboard table over `data/sampleLeaderboard.ts` — one
 * canonical ranking, not a UI-only mock — with the current user's row
 * pinned at the end and a sidebar summarizing their position, this
 * week's leaders and per-subject leaders.
 */
export function RatingDesktop() {
  const [view, setView] = useState('overall');
  const [period, setPeriod] = useState('all');
  const [subjectId, setSubjectId] = useState('all');

  const subjectOptions = [
    { value: 'all', label: 'Все предметы' },
    ...subjects.map((s) => ({ value: s.id, label: s.shortName })),
  ];

  // "По предметам" needs one concrete subject to rank by; "Все
  // предметы" (the overall-view default) falls back to the first real
  // subject rather than rendering an empty/undefined ranking.
  const activeSubjectId = subjectId === 'all' ? subjects[0]!.id : subjectId;
  const activeSubjectName =
    subjects.find((s) => s.id === activeSubjectId)?.shortName ?? subjects[0]!.shortName;

  const bySubjectRanking = useMemo(() => getSubjectLeaderboard(activeSubjectId), [activeSubjectId]);

  let entries: readonly LeaderboardEntry[];
  let currentEntry: LeaderboardEntry;
  if (view === 'bySubject') {
    entries = bySubjectRanking.filter((entry) => entry.id !== 'me');
    currentEntry = bySubjectRanking.find((entry) => entry.id === 'me')!;
  } else if (view === 'friends') {
    entries = friendsLeaderboard.filter((entry) => entry.id !== 'me');
    currentEntry = currentUserFriendEntry;
  } else {
    entries = leaderboard;
    currentEntry = currentUserEntry;
  }
  const totalForView = view === 'friends' ? friendsLeaderboard.length : totalParticipants;

  return (
    <FadeIn className={styles.page}>
      <BackRow to={{ screen: 'home' }} label="Главная" />
      <div className={styles.headerRow}>
        <div>
          <h1 className="text-h1">Рейтинг</h1>
          <p className="text-body-sm text-secondary">
            Соревнуйся с другими и мотивируй себя учиться!
          </p>
        </div>
        <div className={styles.controls}>
          <div className={styles.select}>
            <Select options={periodOptions} value={period} onChange={setPeriod} />
          </div>
          <div className={styles.select}>
            <Select options={subjectOptions} value={subjectId} onChange={setSubjectId} />
          </div>
        </div>
      </div>

      <div className={styles.tabRow}>
        {viewTabs.map((tab) => (
          <Chip
            key={tab.id}
            icon={tab.icon}
            selected={view === tab.id}
            onClick={() => setView(tab.id)}
          >
            {tab.label}
          </Chip>
        ))}
      </div>

      {view === 'bySubject' && (
        <p className="text-body-sm text-secondary">Рейтинг по предмету «{activeSubjectName}»</p>
      )}

      <div className={styles.grid}>
        <div className={styles.table}>
          <div className={styles.tableHeaderRow}>
            <span>#</span>
            <span>Пользователь</span>
            <span>Уровень</span>
            <span>Решено заданий</span>
            <span>Правильных ответов</span>
            <span>Серия</span>
            <span style={{ textAlign: 'right' }}>XP</span>
          </div>

          {entries.map((entry) => (
            <div
              key={entry.id}
              className={clsx(styles.row, entry.rank <= 3 && styles.rowTop)}
              style={
                entry.rank <= 3 ? { ['--medal' as string]: medalColor[entry.rank] } : undefined
              }
            >
              <span className={styles.rank}>{entry.rank}</span>
              <span className={styles.userCell}>
                <Avatar
                  username={entry.username}
                  color={entry.avatarColor}
                  avatarUrl={entry.avatarUrl}
                />
                <span className={styles.username}>{entry.username}</span>
                {entry.rank <= 3 && (
                  <span className={styles.badge}>Топ-{entry.rank === 1 ? '1' : '3'}</span>
                )}
              </span>
              <span className={styles.levelCell}>
                <LevelBadge level={entry.level} size={18} lazy /> {entry.level}
              </span>
              <span>{entry.solved.toLocaleString('ru-RU')}</span>
              <span>{entry.accuracyPercent}%</span>
              <span className={styles.streakCell}>
                <StreakBadge days={entry.streakDays} size={18} lazy /> {entry.streakDays}
              </span>
              <span className={styles.xpCell}>{entry.xp.toLocaleString('ru-RU')}</span>
            </div>
          ))}

          <p className={styles.ellipsisRow}>···</p>

          <div className={clsx(styles.row, styles.rowCurrentUser)}>
            <span className={styles.rank}>{currentEntry.rank}</span>
            <span className={styles.userCell}>
              <Avatar
                username={currentEntry.username}
                color={currentEntry.avatarColor}
                avatarUrl={currentEntry.avatarUrl}
              />
              <span className={styles.username}>{currentEntry.username}</span>
              <span className={styles.badge}>Текущая позиция</span>
            </span>
            <span className={styles.levelCell}>
              <LevelBadge level={currentEntry.level} size={18} /> {currentEntry.level}
            </span>
            <span>{currentEntry.solved.toLocaleString('ru-RU')}</span>
            <span>{currentEntry.accuracyPercent}%</span>
            <span className={styles.streakCell}>
              <StreakBadge days={currentEntry.streakDays} size={18} /> {currentEntry.streakDays}
            </span>
            <span className={styles.xpCell}>{currentEntry.xp.toLocaleString('ru-RU')}</span>
          </div>
        </div>

        <div className={styles.sidebar}>
          <Card>
            <p className="text-h3">Твоя позиция</p>
            <div className={styles.positionCard} style={{ marginTop: 'var(--space-3)' }}>
              <span className={styles.positionIcon}>
                <LevelBadge level={currentEntry.level} size={32} />
              </span>
              <div>
                <p className="text-h2">{currentEntry.rank} место</p>
                <p className="text-body-sm text-secondary">
                  из {totalForView.toLocaleString('ru-RU')}{' '}
                  {view === 'friends' ? 'друзей' : 'пользователей'}
                </p>
              </div>
            </div>
            <div className={styles.positionChips}>
              <span className={styles.positionChip}>
                <LevelBadge level={userStats.level} size={18} />
                <span className="text-body-sm">{userStats.level}</span>
              </span>
              <span className={styles.positionChip}>
                <StreakBadge days={userStats.streakDays} size={18} />
                <span className="text-body-sm">{userStats.streakDays}</span>
              </span>
              <span className={styles.positionChip}>
                <Icon name="star" size={16} />
                <span className="text-body-sm">{userStats.accuracy}%</span>
              </span>
            </div>
          </Card>

          {view === 'overall' && (
            <>
              <Card>
                <div className={styles.sectionHeaderRow}>
                  <p className="text-h3">Лидеры недели</p>
                  <span className="text-body-sm text-secondary">Все →</span>
                </div>
                <div className={styles.miniList} style={{ marginTop: 'var(--space-3)' }}>
                  {weeklyLeaders.map((leader) => (
                    <div key={leader.rank} className={styles.miniRow}>
                      <span className={styles.miniRank}>{leader.rank}</span>
                      <Avatar
                        username={leader.username}
                        color={leader.avatarColor}
                        avatarUrl={leader.avatarUrl}
                        size={32}
                      />
                      <span className={styles.miniBody}>{leader.username}</span>
                      <span className={styles.miniXp}>{leader.xp.toLocaleString('ru-RU')} XP</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <div className={styles.sectionHeaderRow}>
                  <p className="text-h3">Топ по предметам</p>
                  <span className="text-body-sm text-secondary">Все →</span>
                </div>
                <div className={styles.miniList} style={{ marginTop: 'var(--space-3)' }}>
                  {subjectLeaders.map((leader) => (
                    <div key={leader.subjectId} className={styles.miniRow}>
                      <Icon name={leader.icon} size={20} />
                      <span className={styles.miniBody}>
                        <p className="text-body-sm">{leader.subjectName}</p>
                        <p className="text-body-sm text-secondary">{leader.username}</p>
                      </span>
                      <span className={styles.miniXp}>{leader.xp.toLocaleString('ru-RU')} XP</span>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {view === 'friends' && (
            <Card>
              <p className="text-h3">Друзья</p>
              <p className="text-body-sm text-secondary" style={{ marginTop: 'var(--space-2)' }}>
                Только твой близкий круг — не общий рейтинг.
              </p>
            </Card>
          )}
        </div>
      </div>
    </FadeIn>
  );
}
