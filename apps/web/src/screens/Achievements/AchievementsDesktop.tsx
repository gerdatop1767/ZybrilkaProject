import { WipPlaceholder } from '../../ui/WipPlaceholder/WipPlaceholder.js';
import { FadeIn } from '../../ui/motion/motion.js';
import styles from './AchievementsDesktop.module.css';

/**
 * Desktop Достижения — no achievements backend exists yet (unlock
 * logic, categories, progress/target tracking), so this stays a
 * neutral placeholder rather than rendering `data/sampleAchievements.ts`
 * as if it were the user's real progress.
 */
export function AchievementsDesktop() {
  return (
    <FadeIn className={styles.page}>
      <div>
        <h1 className="text-h1">Достижения</h1>
        <p className="text-body-sm text-secondary">
          Решай задания, развивайся и открывай новые награды!
        </p>
      </div>
      <WipPlaceholder title="Достижения" note="Экран в разработке — следующий блок." />
    </FadeIn>
  );
}
