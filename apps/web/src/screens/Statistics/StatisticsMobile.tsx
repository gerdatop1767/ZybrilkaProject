import { useState } from 'react';
import { useNavigation } from '../../lib/navigation.js';
import { subjects } from '../../data/subjects.js';
import { sampleTask } from '../../data/sampleTask.js';
import { userStats } from '../../data/sampleProgress.js';
import { taskNumberProgress, topicMasteryRows, mockExams } from '../../data/sampleStatistics.js';
import { Card } from '../../ui/Card/Card.js';
import { Tabs } from '../../ui/Tabs/Tabs.js';
import { Icon } from '../../ui/Icon/Icon.js';
import { SubjectHeaderMobile } from '../../ui/SubjectHeader/SubjectHeaderMobile.js';
import { StatTile } from '../../ui/Statistics/StatTile.js';
import { TaskNumberBars } from '../../ui/Statistics/TaskNumberBars.js';
import { TopicProgressRow } from '../../ui/Statistics/TopicProgressRow.js';
import { MockExamCard, NewMockExamCard } from '../../ui/Statistics/MockExamCard.js';
import { WipPlaceholder } from '../../ui/WipPlaceholder/WipPlaceholder.js';
import { SlideUp } from '../../ui/motion/motion.js';
import styles from './StatisticsMobile.module.css';

const subTabs = [
  { id: 'overview', label: 'Общая' },
  { id: 'byTask', label: 'По заданиям' },
  { id: 'byTopic', label: 'По темам' },
  { id: 'exams', label: 'Пробники' },
];

/**
 * Mobile Statistics (S1 Block 6, approved design —
 * mobile/07_statistics.png): the "Общая" sub-tab reproduces the
 * approved composition in full. The other three sub-tabs are real,
 * switchable tabs with no approved screenshot yet, so — per the same
 * rule already applied to desktop "Учебный центр"/"Меню" — they show
 * the neutral WIP placeholder rather than an invented layout.
 */
export function StatisticsMobile() {
  const { navigate } = useNavigation();
  const [subTab, setSubTab] = useState('overview');
  const subject = subjects.find((s) => s.id === sampleTask.subjectId) ?? subjects[0]!;

  function openTask(taskNumber: number) {
    navigate({
      screen: 'task',
      subjectId: sampleTask.subjectId,
      taskNumber,
      taskId: sampleTask.id,
    });
  }

  return (
    <SlideUp className={styles.stack}>
      <SubjectHeaderMobile
        subject={subject}
        title="Статистика"
        trailing={
          <button type="button" className={styles.trailingButton} aria-label="Выбрать период">
            <Icon name="calendar" size={20} />
          </button>
        }
      />

      <Tabs items={subTabs} activeId={subTab} onChange={setSubTab} aria-label="Раздел статистики" />

      {subTab !== 'overview' ? (
        <WipPlaceholder
          title={subTabs.find((t) => t.id === subTab)!.label}
          note="Экран в разработке — следующий блок."
        />
      ) : (
        <>
          <div className={styles.statsGrid}>
            <StatTile
              icon="variant"
              iconColor="var(--color-accent-primary-end)"
              label="Решено заданий"
              value={userStats.solvedTotal}
              deltaLabel={`из ${subject.taskCount}`}
            />
            <StatTile
              icon="progress"
              iconColor="var(--color-accent-secondary)"
              label="Точность"
              value={userStats.accuracy}
              suffix="%"
              deltaLabel={`${Math.round((userStats.accuracy / 100) * userStats.solvedTotal)} верных`}
            />
            <StatTile
              icon="xp"
              iconColor="var(--color-gold)"
              label="Текущая серия"
              value={userStats.streakDays}
              suffix=" дней"
            />
            <StatTile
              icon="time"
              iconColor="var(--color-accent-primary)"
              label="Среднее время"
              value="2:14"
              deltaLabel="на задание"
            />
          </div>

          <Card>
            <div className={styles.cardHeaderRow}>
              <p className="text-h3">Прогресс по заданиям (1–19)</p>
            </div>
            <TaskNumberBars rows={taskNumberProgress} onSelect={openTask} />
          </Card>

          <Card>
            <div className={styles.cardHeaderRow}>
              <p className="text-h3">Прогресс по темам</p>
              <button
                type="button"
                className={styles.linkButton}
                onClick={() => navigate({ screen: 'subjectCatalog' })}
              >
                Все темы <Icon name="chevronRight" size={14} />
              </button>
            </div>
            <div className={styles.topicList}>
              {topicMasteryRows.map((row) => (
                <TopicProgressRow
                  key={row.topic}
                  icon={row.icon}
                  topic={row.topic}
                  masteryPercent={row.masteryPercent}
                  onSelect={() => openTask(sampleTask.number)}
                />
              ))}
            </div>
          </Card>

          <Card>
            <div className={styles.cardHeaderRow}>
              <p className="text-h3">Решённые пробники</p>
              <span className={styles.linkButton}>
                Все пробники <Icon name="chevronRight" size={14} />
              </span>
            </div>
            <div className={styles.examScroller}>
              {mockExams.map((exam) => (
                <MockExamCard key={exam.id} exam={exam} />
              ))}
              <NewMockExamCard />
            </div>
          </Card>

          <button
            type="button"
            className={styles.mistakesLink}
            onClick={() => navigate({ screen: 'mistakes' })}
          >
            <Icon name="mistakes" size={20} />
            <span className={styles.mistakesLinkLabel}>Мои ошибки</span>
            <Icon name="chevronRight" size={18} />
          </button>

          <button
            type="button"
            className={styles.mistakesLink}
            onClick={() => navigate({ screen: 'about' })}
          >
            <Icon name="info" size={20} />
            <span className={styles.mistakesLinkLabel}>О проекте</span>
            <Icon name="chevronRight" size={18} />
          </button>
        </>
      )}
    </SlideUp>
  );
}
