import { useEffect, useState } from 'react';
import { getProgressSummary } from '../../lib/api.js';
import type { ProgressSummary } from '@zybrilka/shared';
import { Card } from '../../ui/Card/Card.js';
import { Icon } from '../../ui/Icon/Icon.js';
import { SectionHeader } from '../../ui/SectionHeader/SectionHeader.js';
import { useNavigation } from '../../lib/navigation.js';
import { SlideUp } from '../../ui/motion/motion.js';
import styles from './Profile.module.css';

/**
 * Profile — identity (no auth/user-profile backend exists yet, so no
 * name/avatar/bio is shown as if it were real), real solved/accuracy
 * from `GET /progress/summary`, and a neutral placeholder for
 * achievements (no achievements backend exists — see docs/
 * PRODUCTION_DATA_MODEL.md before building one instead of guessing).
 */
export function Profile() {
  const { navigate } = useNavigation();
  const [progress, setProgress] = useState<ProgressSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getProgressSummary()
      .then((data) => {
        if (!cancelled) setProgress(data);
      })
      .catch(() => {
        // No backend data yet (or the request failed) — stats stay at
        // their neutral zero state below.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SlideUp className={styles.stack}>
      <h1 className="text-h1">Профиль</h1>

      <Card>
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <span className="text-stat">{progress?.solvedTotal ?? 0}</span>
            <span className="text-body-sm text-secondary">Решено</span>
          </div>
          <div className={styles.stat}>
            <span className="text-stat">
              {progress ? Math.round(progress.accuracyPercent) : 0}%
            </span>
            <span className="text-body-sm text-secondary">Точность</span>
          </div>
        </div>
      </Card>

      <div>
        <SectionHeader title="Достижения" />
        <Card>
          <p className="text-body-sm text-secondary">Достижения скоро появятся здесь.</p>
        </Card>
      </div>

      <div>
        <SectionHeader title="Настройки" />
        <Card>
          <button
            type="button"
            className={styles.settingsRow}
            onClick={() => navigate({ screen: 'onboarding' })}
          >
            <span className={styles.settingsIcon}>
              <Icon name="smart" size={18} />
            </span>
            <span className={styles.settingsLabel}>Пройти диагностику заново</span>
          </button>
          <div className={styles.settingsInfo}>
            <Icon name="info" size={18} />
            <span className="text-body-sm">
              Анимации следуют системной настройке «Уменьшить движение»
            </span>
          </div>
        </Card>
      </div>
    </SlideUp>
  );
}
