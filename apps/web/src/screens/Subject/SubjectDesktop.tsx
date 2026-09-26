import { useState } from 'react';
import { useNavigation } from '../../lib/navigation.js';
import { subjects } from '../../data/subjects.js';
import {
  getSubjectContent,
  getTaskNumbers,
  getTopicProgress,
  type SubjectModeId,
  type SubjectTopic,
} from '../../data/subjectContent.js';
import { BackRow, type BackRowProps } from '../../ui/BackRow/BackRow.js';
import { Card } from '../../ui/Card/Card.js';
import { Button } from '../../ui/Button/Button.js';
import { Icon } from '../../ui/Icon/Icon.js';
import type { IconName } from '../../ui/Icon/icons.js';
import { SubjectTile } from '../../ui/SubjectTile/SubjectTile.js';
import { ProgressBar } from '../../ui/Progress/ProgressBar.js';
import { CircularProgress } from '../../ui/Progress/CircularProgress.js';
import { clsx } from '../../lib/clsx.js';
import styles from './SubjectDesktop.module.css';

export interface SubjectDesktopProps {
  subjectId: string;
  from?: 'subjectCatalog' | 'learningCenter';
}

const modes: readonly { id: SubjectModeId; label: string; caption: string; icon: IconName }[] = [
  { id: 'topics', label: 'Темы', caption: 'Все темы по номерам', icon: 'reference' },
  {
    id: 'byNumber',
    label: 'Задания по номерам',
    caption: 'Выбрать конкретное задание',
    icon: 'checklist',
  },
  { id: 'variants', label: 'Варианты', caption: 'Полные варианты ЕГЭ', icon: 'variant' },
  { id: 'random', label: 'Случайные задания', caption: 'Тренировка без тем', icon: 'smart' },
  { id: 'favorites', label: 'Избранное', caption: 'Сохранённые задания', icon: 'favorite' },
];

/**
 * Desktop Subject page (approved references: 01_MATH…09_HISTORY_
 * DESKTOP.png) — one generic component for every subject. Per-subject
 * differences (topics, tagline, task-number count) come entirely from
 * `data/subjectContent.ts`; adding a 10th subject means adding data
 * there, never copying this component. `mode` and the topic/number
 * drill-downs are local state, not global routes — there's nothing
 * here a deep link needs to restore, and it keeps this screen's own
 * back-stack (topic/number → list) independent of the app router's.
 */
export function SubjectDesktop({ subjectId, from }: SubjectDesktopProps) {
  const { navigate } = useNavigation();
  const subject = subjects.find((s) => s.id === subjectId) ?? subjects[0]!;
  const content = getSubjectContent(subject.id);

  const [mode, setMode] = useState<SubjectModeId>('topics');
  const [selectedTopic, setSelectedTopic] = useState<SubjectTopic | null>(null);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);

  const solved = Math.round((subject.taskCount * subject.mastery) / 100);
  const friendRank = 1 + (hashCode(subject.id) % 12);
  const taskNumbers = getTaskNumbers(subject.id);

  function startTraining(taskNumber: number) {
    navigate({
      screen: 'task',
      subjectId: subject.id,
      taskNumber,
      taskId: 'demo-3214',
    });
  }

  const parentLabel = from === 'learningCenter' ? 'К учебному центру' : 'К предметам';
  const parentScreen: 'subjectCatalog' | 'learningCenter' = from ?? 'subjectCatalog';
  const backProps: BackRowProps = selectedTopic
    ? { onBack: () => setSelectedTopic(null), label: subject.shortName }
    : selectedNumber
      ? { onBack: () => setSelectedNumber(null), label: 'Задания по номерам' }
      : { to: { screen: parentScreen }, label: parentLabel };

  return (
    <div>
      <BackRow {...backProps} />

      <div className={styles.hero}>
        <div
          className={styles.heroIllustration}
          style={{ ['--subject-accent' as string]: subject.color }}
        >
          <SubjectTile glyph={subject.glyph} color={subject.color} size={72} />
        </div>
        <div className={styles.heroText}>
          <h1 className="text-h1">{subject.shortName}</h1>
          <p className="text-body-sm text-secondary">{content.tagline}</p>
          <div className={styles.heroStats}>
            <span className={styles.heroStat}>
              <Icon name="target" size={16} />
              <strong>{solved}</strong> заданий решено
            </span>
            <span className={styles.heroStat}>
              <Icon name="progress" size={16} />
              <strong>{subject.mastery}%</strong> средняя точность
            </span>
            <span className={styles.heroStat}>
              <Icon name="crown" size={16} />
              <strong>{friendRank}</strong> место среди друзей
            </span>
          </div>
        </div>
      </div>

      <div className={styles.modes}>
        {modes.map((item) => (
          <button
            key={item.id}
            type="button"
            className={clsx(styles.modeButton, mode === item.id && styles.modeButtonActive)}
            onClick={() => {
              setMode(item.id);
              setSelectedTopic(null);
              setSelectedNumber(null);
            }}
          >
            <Icon name={item.icon} size={18} />
            <span>
              <span className={styles.modeLabel}>{item.label}</span>
              <span className={styles.modeCaption}>{item.caption}</span>
            </span>
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        <div className={styles.main}>
          {mode === 'topics' && !selectedTopic && (
            <TopicsList
              subjectId={subject.id}
              topics={content.topics}
              onSelect={setSelectedTopic}
            />
          )}
          {mode === 'topics' && selectedTopic && (
            <TopicDetail
              subjectId={subject.id}
              topic={selectedTopic}
              onStart={() => startTraining(selectedTopic.number)}
            />
          )}
          {mode === 'byNumber' && selectedNumber === null && (
            <TaskNumberGrid numbers={taskNumbers} onSelect={setSelectedNumber} />
          )}
          {mode === 'byNumber' && selectedNumber !== null && (
            <TaskNumberDetail
              subjectName={subject.shortName}
              number={selectedNumber}
              summary={taskNumbers.find((n) => n.number === selectedNumber)!}
              onStart={() => startTraining(selectedNumber)}
            />
          )}
          {mode === 'variants' && (
            <ModePlaceholder
              icon="variant"
              title="Полные варианты ЕГЭ"
              note="Сборка полных тренировочных вариантов — следующий блок."
              actionLabel="Решить пробный вариант"
              onAction={() => startTraining(1)}
            />
          )}
          {mode === 'random' && (
            <ModePlaceholder
              icon="smart"
              title="Случайные задания"
              note="Тренировка вперемешку по всем темам — следующий блок."
              actionLabel="Начать случайное задание"
              onAction={() => startTraining(1)}
            />
          )}
          {mode === 'favorites' && (
            <ModePlaceholder
              icon="favorite"
              title="Избранное"
              note="Сохранённые задания появятся здесь, как только ты добавишь первое."
            />
          )}
        </div>

        <div className={styles.sidebar}>
          <Card>
            <p className="text-h3">Твой прогресс</p>
            <div className={styles.progressRing}>
              <CircularProgress value={subject.mastery} size={110} strokeWidth={10}>
                <span className="text-h2">{subject.mastery}%</span>
              </CircularProgress>
            </div>
            <p className="text-body-sm text-secondary" style={{ textAlign: 'center' }}>
              {solved} из {subject.taskCount} заданий решено
            </p>
          </Card>

          <Card>
            <p className="text-h3">Быстрый старт</p>
            <div className={styles.quickList}>
              <button type="button" className={styles.quickRow} onClick={() => startTraining(1)}>
                <Icon name="play" size={18} />
                <span>
                  <p className="text-body-sm" style={{ fontWeight: 700 }}>
                    Продолжить
                  </p>
                  <p className="text-body-sm text-secondary">Тема {content.topics[0]!.title}</p>
                </span>
                <Icon name="arrowRight" size={16} className={styles.quickArrow} />
              </button>
              <button
                type="button"
                className={styles.quickRow}
                onClick={() => {
                  setMode('random');
                  setSelectedTopic(null);
                  setSelectedNumber(null);
                }}
              >
                <Icon name="smart" size={18} />
                <span>
                  <p className="text-body-sm" style={{ fontWeight: 700 }}>
                    Случайное задание
                  </p>
                  <p className="text-body-sm text-secondary">Любая тема</p>
                </span>
                <Icon name="arrowRight" size={16} className={styles.quickArrow} />
              </button>
              <button
                type="button"
                className={styles.quickRow}
                onClick={() => {
                  setMode('variants');
                  setSelectedTopic(null);
                  setSelectedNumber(null);
                }}
              >
                <Icon name="variant" size={18} />
                <span>
                  <p className="text-body-sm" style={{ fontWeight: 700 }}>
                    Решить вариант
                  </p>
                  <p className="text-body-sm text-secondary">Полный вариант ЕГЭ</p>
                </span>
                <Icon name="arrowRight" size={16} className={styles.quickArrow} />
              </button>
            </div>
          </Card>

          <Card>
            <p className="text-h3">Последние решения</p>
            <div className={styles.recentList}>
              {content.topics.slice(0, 4).map((topic, index) => {
                const correct = (hashCode(`${subject.id}:${topic.id}`) + index) % 3 !== 0;
                return (
                  <div key={topic.id} className={styles.recentRow}>
                    <Icon
                      name={correct ? 'success' : 'errorCircle'}
                      size={18}
                      className={correct ? styles.recentSuccess : styles.recentError}
                    />
                    <span className={styles.recentBody}>
                      <p className="text-body-sm" style={{ fontWeight: 700 }}>
                        Задание {topic.number}
                      </p>
                      <p className="text-body-sm text-secondary">{topic.title}</p>
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function hashCode(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function TopicsList({
  subjectId,
  topics,
  onSelect,
}: {
  subjectId: string;
  topics: readonly SubjectTopic[];
  onSelect: (topic: SubjectTopic) => void;
}) {
  return (
    <Card>
      <p className="text-h3">Темы ЕГЭ</p>
      <div className={styles.topicList}>
        {topics.map((topic) => {
          const progress = getTopicProgress(subjectId, topic);
          return (
            <button
              key={topic.id}
              type="button"
              className={styles.topicRow}
              onClick={() => onSelect(topic)}
            >
              <span className={styles.topicNumber}>{topic.number}</span>
              <span className={styles.topicBody}>
                <p className="text-body" style={{ fontWeight: 700 }}>
                  {topic.title}
                </p>
                <p className="text-body-sm text-secondary">{topic.description}</p>
              </span>
              <span className={styles.topicStats}>
                <span className="text-body-sm text-secondary">
                  {progress.solved} / {progress.total} решено
                </span>
                <ProgressBar value={(progress.solved / progress.total) * 100} />
                <span className="text-body-sm text-secondary">
                  {progress.accuracyPercent}% точность
                </span>
              </span>
              <Icon name="chevronRight" size={18} className={styles.topicArrow} />
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function TopicDetail({
  subjectId,
  topic,
  onStart,
}: {
  subjectId: string;
  topic: SubjectTopic;
  onStart: () => void;
}) {
  const progress = getTopicProgress(subjectId, topic);
  return (
    <Card>
      <p className="text-h2">{topic.title}</p>
      <p className="text-body-sm text-secondary" style={{ marginTop: 'var(--space-1)' }}>
        {topic.description}
      </p>
      <div className={styles.topicDetailStats}>
        <span className="text-body-sm text-secondary">
          {progress.solved} / {progress.total} решено · {progress.accuracyPercent}% точность
        </span>
        <ProgressBar value={(progress.solved / progress.total) * 100} />
      </div>
      <Button variant="primary" onClick={onStart} style={{ marginTop: 'var(--space-4)' }}>
        Начать тренировку <Icon name="arrowRight" size={16} />
      </Button>
    </Card>
  );
}

function TaskNumberGrid({
  numbers,
  onSelect,
}: {
  numbers: readonly { number: number; solved: number; total: number }[];
  onSelect: (number: number) => void;
}) {
  return (
    <Card>
      <p className="text-h3">Задания по номерам</p>
      <p className="text-body-sm text-secondary">Выбери номер задания ЕГЭ</p>
      <div className={styles.numberGrid}>
        {numbers.map((item) => (
          <button
            key={item.number}
            type="button"
            className={styles.numberTile}
            onClick={() => onSelect(item.number)}
          >
            <span className={styles.numberValue}>№{item.number}</span>
            <span className="text-body-sm text-secondary">
              {item.solved}/{item.total}
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
}

function TaskNumberDetail({
  subjectName,
  number,
  summary,
  onStart,
}: {
  subjectName: string;
  number: number;
  summary: { solved: number; total: number };
  onStart: () => void;
}) {
  return (
    <Card>
      <p className="text-h2">Задание №{number}</p>
      <p className="text-body-sm text-secondary" style={{ marginTop: 'var(--space-1)' }}>
        {subjectName} · доступно заданий этого номера: {summary.total}
      </p>
      <div className={styles.topicDetailStats}>
        <span className="text-body-sm text-secondary">
          {summary.solved} / {summary.total} решено
        </span>
        <ProgressBar value={(summary.solved / summary.total) * 100} />
      </div>
      <Button variant="primary" onClick={onStart} style={{ marginTop: 'var(--space-4)' }}>
        Начать тренировку по №{number} <Icon name="arrowRight" size={16} />
      </Button>
    </Card>
  );
}

function ModePlaceholder({
  icon,
  title,
  note,
  actionLabel,
  onAction,
}: {
  icon: IconName;
  title: string;
  note: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Card className={styles.placeholderCard}>
      <span className={styles.placeholderIcon}>
        <Icon name={icon} size={28} />
      </span>
      <p className="text-h3">{title}</p>
      <p className="text-body-sm text-secondary">{note}</p>
      {actionLabel && onAction && (
        <Button variant="secondary" onClick={onAction} style={{ marginTop: 'var(--space-4)' }}>
          {actionLabel}
        </Button>
      )}
    </Card>
  );
}
