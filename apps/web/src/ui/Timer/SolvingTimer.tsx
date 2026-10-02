import type { SolvingTimer as SolvingTimerState } from '../../lib/useSolvingTimer.js';
import { formatElapsed } from '../../lib/formatElapsed.js';
import { Icon } from '../Icon/Icon.js';
import styles from './SolvingTimer.module.css';

export interface SolvingTimerProps {
  timer: SolvingTimerState;
}

/**
 * ZUBRILKA — a real, compact solving timer for the Task screen (never
 * the old static "00:12:34"). Deliberately tiny: a clock readout plus
 * one action button, built from the existing `Icon` primitive only —
 * no new card/surface, so it sits inline in the existing header row on
 * both Desktop and Mobile without adding visual weight.
 */
export function SolvingTimer({ timer }: SolvingTimerProps) {
  if (timer.status === 'idle') {
    return (
      <button type="button" className={styles.timer} onClick={timer.start}>
        <Icon name="time" size={16} />
        <span className="text-body-sm">Начать</span>
      </button>
    );
  }

  const icon = timer.status === 'paused' ? 'pause' : 'time';
  const action =
    timer.status === 'running' ? (
      <button
        type="button"
        className={styles.action}
        onClick={timer.pause}
        aria-label="Пауза"
        title="Пауза"
      >
        <Icon name="pause" size={14} />
      </button>
    ) : timer.status === 'paused' ? (
      <button
        type="button"
        className={styles.action}
        onClick={timer.resume}
        aria-label="Продолжить"
        title="Продолжить"
      >
        <Icon name="play" size={14} />
      </button>
    ) : null;

  return (
    <div className={styles.timer} data-paused={timer.status === 'paused' || undefined}>
      <Icon name={icon} size={16} />
      <span className="text-body-sm">{formatElapsed(timer.elapsedMs)}</span>
      {action}
    </div>
  );
}
