import { useNavigation } from '../../lib/navigation.js';
import { subjects } from '../../data/subjects.js';
import { userStats } from '../../data/sampleProgress.js';
import { Button } from '../../ui/Button/Button.js';
import { Icon } from '../../ui/Icon/Icon.js';
import { SubjectTile } from '../../ui/SubjectTile/SubjectTile.js';
import { ProgressBar } from '../../ui/Progress/ProgressBar.js';
import { StatRow } from '../../ui/StatRow/StatRow.js';
import { sampleTask } from '../../data/sampleTask.js';
import { SlideUp } from '../../ui/motion/motion.js';
import styles from './HomeMobile.module.css';

/**
 * Mobile Home (S1 Block 6, approved design — mobile/01_home.png): the
 * logged-in dashboard. Structurally its own composition, not a scaled
 * desktop layout — desktop Home is a separate marketing page
 * (see HomeDesktop.tsx).
 */
export function HomeMobile() {
  const { navigate } = useNavigation();
  const levelPercent = Math.round((userStats.xp / userStats.xpToNextLevel) * 100);
  const popularSubjects = subjects.slice(0, 6);

  return (
    <SlideUp className={styles.stack}>
      <div className={styles.hero}>
        <div className={styles.heroTiles} aria-hidden="true">
          <span className={styles.heroTilePi}>π</span>
          <span className={styles.heroTileAa}>Aa</span>
          <span className={styles.heroTileM}>M</span>
        </div>
        <p className="text-h2">
          Готов к новой <span className={styles.heroAccent}>тренировке?</span>
        </p>
        <p className="text-body-sm text-secondary">
          Решай задания, развивайся и достигай своих целей!
        </p>
        <Button
          variant="primary"
          fullWidth
          className={styles.heroCta}
          onClick={() => navigate({ screen: 'training' })}
        >
          Начать тренировку <Icon name="arrowRight" size={18} />
        </Button>
      </div>

      <div className={styles.progressCard}>
        <div className={styles.progressHeader}>
          <span className={styles.levelBadge}>{userStats.level}</span>
          <div className={styles.progressHeaderText}>
            <p className="text-body" style={{ fontWeight: 700 }}>
              Уровень {userStats.level}
            </p>
            <ProgressBar value={levelPercent} label="Опыт" />
          </div>
          <span className="text-body-sm text-secondary">
            {userStats.xp} / {userStats.xpToNextLevel} XP
          </span>
        </div>
        <StatRow
          items={[
            {
              id: 'streak',
              value: (
                <span className={styles.statValue}>
                  <Icon name="flame" size={16} className={styles.statIconGold} />
                  {userStats.streakDays} дней
                </span>
              ),
              label: 'Серия',
            },
            {
              id: 'solved',
              value: (
                <span className={styles.statValue}>
                  <Icon name="success" size={16} className={styles.statIconSuccess} />
                  {userStats.solvedTotal}
                </span>
              ),
              label: 'Решено',
            },
            {
              id: 'accuracy',
              value: (
                <span className={styles.statValue}>
                  <Icon name="star" size={16} className={styles.statIconGold} />
                  {userStats.accuracy}%
                </span>
              ),
              label: 'Правильно',
            },
          ]}
        />
      </div>

      <div>
        <div className={styles.sectionHeader}>
          <p className="text-h3">Популярные предметы</p>
          <button
            type="button"
            className={styles.sectionLink}
            onClick={() => navigate({ screen: 'subjectCatalog' })}
          >
            Все предметы <Icon name="chevronRight" size={16} />
          </button>
        </div>
        <div className={styles.subjectGrid}>
          {popularSubjects.map((subject) => (
            <button
              key={subject.id}
              type="button"
              className={styles.subjectCard}
              onClick={() => navigate({ screen: 'subject', subjectId: subject.id })}
            >
              <SubjectTile glyph={subject.glyph} color={subject.color} size={36} />
              <span className={styles.subjectCardText}>
                <span className="text-body-sm" style={{ fontWeight: 600 }}>
                  {subject.shortName}
                </span>
                <span className={styles.subjectCardCount}>
                  {subject.taskCount.toLocaleString('ru-RU')} заданий
                </span>
              </span>
              <Icon name="chevronRight" size={16} className={styles.subjectCardChevron} />
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className={styles.sectionHeader}>
          <p className="text-h3">Продолжить</p>
          <button
            type="button"
            className={styles.sectionLink}
            onClick={() => navigate({ screen: 'training' })}
          >
            Все тренировки <Icon name="chevronRight" size={16} />
          </button>
        </div>
        <button
          type="button"
          className={styles.continueCard}
          onClick={() =>
            navigate({
              screen: 'task',
              subjectId: sampleTask.subjectId,
              taskNumber: sampleTask.number,
              taskId: sampleTask.id,
            })
          }
        >
          <SubjectTile glyph="pi" color="var(--color-subject-math)" size={44} />
          <span className={styles.continueCardText}>
            <span className="text-body" style={{ fontWeight: 600 }}>
              Математика
            </span>
            <span className="text-body-sm text-secondary">Тренировка · 15 заданий</span>
          </span>
          <span className={styles.continueCardArrow}>
            <Icon name="arrowRight" size={18} />
          </span>
        </button>
      </div>
    </SlideUp>
  );
}
