import { useState } from 'react';
import { useNavigation } from '../../lib/navigation.js';
import { subjects } from '../../data/subjects.js';
import { sampleTask } from '../../data/sampleTask.js';
import { Button } from '../../ui/Button/Button.js';
import { Card } from '../../ui/Card/Card.js';
import { Chip } from '../../ui/Chip/Chip.js';
import { Icon } from '../../ui/Icon/Icon.js';
import type { IconName } from '../../ui/Icon/icons.js';
import { Select } from '../../ui/Select/Select.js';
import { clsx } from '../../lib/clsx.js';
import { SlideUp } from '../../ui/motion/motion.js';
import styles from './Training.module.css';

interface TrainingMode {
  id: string;
  icon: IconName;
  label: string;
  description: string;
}

const trainingModes: readonly TrainingMode[] = [
  {
    id: 'topic',
    icon: 'topic',
    label: 'По теме',
    description: 'Выбери конкретную тему для практики',
  },
  {
    id: 'mistakes',
    icon: 'mistakes',
    label: 'Мои ошибки',
    description: 'Разбери задания, где были ошибки',
  },
  { id: 'review', icon: 'star', label: 'Повторение', description: 'Закрепи то, что уже решал' },
  {
    id: 'smart',
    icon: 'smart',
    label: 'Умная тренировка',
    description: 'Подбор заданий под твой прогресс',
  },
  { id: 'variant', icon: 'variant', label: 'Вариант', description: 'Полный вариант ЕГЭ на время' },
];

const difficultyOptions = [
  { value: '1', label: 'Лёгкий' },
  { value: '2', label: 'Средний' },
  { value: '3', label: 'Сложный' },
];

const quantityOptions = ['5', '10', '20'];

const subjectSelectOptions = subjects.map((subject) => ({
  value: subject.id,
  label: subject.name,
}));

/**
 * Training (Design Spec Section 7): the setup screen before solving —
 * subject, mode, difficulty and quantity, then into Task.
 */
export function Training() {
  const { navigate } = useNavigation();
  const [subjectId, setSubjectId] = useState<string | null>('math');
  const [modeId, setModeId] = useState('topic');
  const [difficulty, setDifficulty] = useState('2');
  const [quantity, setQuantity] = useState('10');

  return (
    <SlideUp className={styles.stack}>
      <h1 className="text-h1">Тренировка</h1>

      <Select
        label="Предмет"
        options={subjectSelectOptions}
        value={subjectId}
        onChange={setSubjectId}
      />

      <div>
        <p className={clsx('text-label', styles.sectionLabel)}>Режим тренировки</p>
        <div className={styles.modeGrid}>
          {trainingModes.map((mode) => {
            const selected = mode.id === modeId;
            return (
              <button
                key={mode.id}
                type="button"
                className={clsx(styles.modeCard, selected && styles.modeCardSelected)}
                aria-pressed={selected}
                onClick={() => setModeId(mode.id)}
              >
                <span className={styles.modeIcon}>
                  <Icon name={mode.icon} size={20} />
                </span>
                <span className={styles.modeText}>
                  <span className="text-body">{mode.label}</span>
                  <span className="text-body-sm text-secondary">{mode.description}</span>
                </span>
                {selected && (
                  <span className={styles.modeCheck}>
                    <Icon name="check" size={20} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className={clsx('text-label', styles.sectionLabel)}>Сложность</p>
        <div className={styles.chipRow}>
          {difficultyOptions.map((option) => (
            <Chip
              key={option.value}
              selected={option.value === difficulty}
              onClick={() => setDifficulty(option.value)}
            >
              {option.label}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <p className={clsx('text-label', styles.sectionLabel)}>Количество заданий</p>
        <div className={styles.chipRow}>
          {quantityOptions.map((option) => (
            <Chip key={option} selected={option === quantity} onClick={() => setQuantity(option)}>
              {option}
            </Chip>
          ))}
        </div>
      </div>

      <Card>
        <p className="text-body-sm text-secondary">
          {trainingModes.find((mode) => mode.id === modeId)?.label} ·{' '}
          {difficultyOptions.find((option) => option.value === difficulty)?.label} · {quantity}{' '}
          заданий
        </p>
      </Card>

      <Button
        variant="primary"
        fullWidth
        onClick={() => navigate({ screen: 'task', taskId: sampleTask.id })}
      >
        Начать тренировку
      </Button>
    </SlideUp>
  );
}
