import { Icon } from '../Icon/Icon.js';
import { DifficultyTag } from '../Training/DifficultyTag.js';
import type { Mistake } from '../../data/sampleMistakes.js';
import { getTopicColor } from '../../data/sampleMistakes.js';
import { formatDateLong } from '../../lib/formatDate.js';
import { InlineMathText } from '../MathText/MathText.js';
import styles from './MistakeCardMobile.module.css';

export interface MistakeCardMobileProps {
  mistake: Mistake;
  selected: boolean;
  onToggleSelect: () => void;
  onRetry: () => void;
  onOpen: () => void;
}

/**
 * Mobile "Повторить ошибки" list row (S1 Block 6, approved design —
 * mobile/08_mistakes.png): task-number + topic + difficulty chips and
 * a date on one line, the full condition below, a retry icon and a
 * chevron into the task. Tapping the condition or the chevron opens
 * the task; the checkbox and retry button are independent controls.
 */
export function MistakeCardMobile({
  mistake,
  selected,
  onToggleSelect,
  onRetry,
  onOpen,
}: MistakeCardMobileProps) {
  const color = getTopicColor(mistake.topic);

  return (
    <div className={styles.card}>
      <div className={styles.topRow}>
        <button
          type="button"
          className={`${styles.checkbox} ${selected ? styles.checkboxChecked : ''}`}
          aria-label={selected ? 'Убрать из выбранных' : 'Выбрать ошибку'}
          aria-pressed={selected}
          onClick={onToggleSelect}
        >
          <Icon name={selected ? 'checkboxChecked' : 'checkboxEmpty'} size={20} />
        </button>
        <span className={styles.metaRow}>
          <span className={styles.numberChip}>№{mistake.taskNumber}</span>
          <span className={styles.topicChip} style={{ background: `${color}26`, color }}>
            {mistake.topic}
          </span>
          <DifficultyTag label={mistake.difficultyLabel} />
        </span>
        <span className={styles.date}>{formatDateLong(mistake.date)}</span>
      </div>

      <button type="button" className={styles.condition} onClick={onOpen}>
        <InlineMathText text={mistake.condition} />
      </button>

      <div className={styles.bottomRow}>
        <button
          type="button"
          className={styles.retryButton}
          aria-label={`Повторить задание ${mistake.taskNumber}`}
          onClick={onRetry}
        >
          <Icon name="retry" size={16} />
        </button>
        <button type="button" aria-label="Открыть задание" onClick={onOpen}>
          <Icon name="chevronRight" size={18} className={styles.chevron} />
        </button>
      </div>
    </div>
  );
}
