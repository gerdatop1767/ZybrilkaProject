import { useState } from 'react';
import { subjects } from '../../data/subjects.js';
import {
  leaderboard,
  currentUserEntry,
  totalParticipants,
  weeklyLeaders,
  subjectLeaders,
} from '../../data/sampleLeaderboard.js';
import { userStats } from '../../data/sampleProgress.js';
import { Card } from '../../ui/Card/Card.js';
import { Chip } from '../../ui/Chip/Chip.js';
import { Select } from '../../ui/Select/Select.js';
import { Icon } from '../../ui/Icon/Icon.js';
import { Avatar } from '../../ui/Leaderboard/Avatar.js';
import { WipPlaceholder } from '../../ui/WipPlaceholder/WipPlaceholder.js';
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

  return (
    <FadeIn className={styles.page}>
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

      {view !== 'overall' ? (
        <WipPlaceholder
          title={viewTabs.find((t) => t.id === view)!.label}
          note="Экран в разработке — следующий блок."
        />
      ) : (
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

            {leaderboard.map((entry) => (
              <div
                key={entry.id}
                className={clsx(styles.row, entry.rank <= 3 && styles.rowTop)}
                style={
                  entry.rank <= 3 ? { ['--medal' as string]: medalColor[entry.rank] } : undefined
                }
              >
                <span className={styles.rank}>{entry.rank}</span>
                <span className={styles.userCell}>
                  <Avatar username={entry.username} color={entry.avatarColor} />
                  <span className={styles.username}>{entry.username}</span>
                  {entry.rank <= 3 && (
                    <span className={styles.badge}>Топ-{entry.rank === 1 ? '1' : '3'}</span>
                  )}
                </span>
                <span className={styles.levelCell}>
                  <Icon name="crown" size={16} /> {entry.level}
                </span>
                <span>{entry.solved.toLocaleString('ru-RU')}</span>
                <span>{entry.accuracyPercent}%</span>
                <span className={styles.streakCell}>
                  <Icon name="flame" size={16} /> {entry.streakDays}
                </span>
                <span className={styles.xpCell}>{entry.xp.toLocaleString('ru-RU')}</span>
              </div>
            ))}

            <p className={styles.ellipsisRow}>···</p>

            <div className={clsx(styles.row, styles.rowCurrentUser)}>
              <span className={styles.rank}>{currentUserEntry.rank}</span>
              <span className={styles.userCell}>
                <Avatar username={currentUserEntry.username} color={currentUserEntry.avatarColor} />
                <span className={styles.username}>{currentUserEntry.username}</span>
                <span className={styles.badge}>Текущая позиция</span>
              </span>
              <span className={styles.levelCell}>
                <Icon name="crown" size={16} /> {currentUserEntry.level}
              </span>
              <span>{currentUserEntry.solved.toLocaleString('ru-RU')}</span>
              <span>{currentUserEntry.accuracyPercent}%</span>
              <span className={styles.streakCell}>
                <Icon name="flame" size={16} /> {currentUserEntry.streakDays}
              </span>
              <span className={styles.xpCell}>{currentUserEntry.xp.toLocaleString('ru-RU')}</span>
            </div>
          </div>

          <div className={styles.sidebar}>
            <Card>
              <p className="text-h3">Твоя позиция</p>
              <div className={styles.positionCard} style={{ marginTop: 'var(--space-3)' }}>
                <span className={styles.positionIcon}>
                  <Icon name="crown" size={26} />
                </span>
                <div>
                  <p className="text-h2">{currentUserEntry.rank} место</p>
                  <p className="text-body-sm text-secondary">
                    из {totalParticipants.toLocaleString('ru-RU')} пользователей
                  </p>
                </div>
              </div>
              <div className={styles.positionChips}>
                <span className={styles.positionChip}>
                  <Icon name="crown" size={16} />
                  <span className="text-body-sm">{userStats.level}</span>
                </span>
                <span className={styles.positionChip}>
                  <Icon name="flame" size={16} />
                  <span className="text-body-sm">{userStats.streakDays}</span>
                </span>
                <span className={styles.positionChip}>
                  <Icon name="star" size={16} />
                  <span className="text-body-sm">{userStats.accuracy}%</span>
                </span>
              </div>
            </Card>

            <Card>
              <div className={styles.sectionHeaderRow}>
                <p className="text-h3">Лидеры недели</p>
                <span className="text-body-sm text-secondary">Все →</span>
              </div>
              <div className={styles.miniList} style={{ marginTop: 'var(--space-3)' }}>
                {weeklyLeaders.map((leader) => (
                  <div key={leader.rank} className={styles.miniRow}>
                    <span className={styles.miniRank}>{leader.rank}</span>
                    <Avatar username={leader.username} color={leader.avatarColor} size={32} />
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
          </div>
        </div>
      )}
    </FadeIn>
  );
}
