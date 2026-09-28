import { subjects } from '../../data/subjects.js';
import { Icon } from '../../ui/Icon/Icon.js';
import { SubjectHeaderMobile } from '../../ui/SubjectHeader/SubjectHeaderMobile.js';
import { WipPlaceholder } from '../../ui/WipPlaceholder/WipPlaceholder.js';
import { SlideUp } from '../../ui/motion/motion.js';
import styles from './AchievementsMobile.module.css';

/**
 * Mobile Достижения — no achievements backend exists yet (unlock
 * logic, categories, level/XP/streak), so this stays a neutral
 * placeholder rather than rendering `data/sampleAchievements.ts`/
 * `data/sampleProgress.ts` as if it were the user's real progress.
 */
export function AchievementsMobile() {
  const subject = subjects.find((s) => s.id === 'math') ?? subjects[0]!;

  return (
    <SlideUp className={styles.stack}>
      <SubjectHeaderMobile
        subject={subject}
        title="Достижения"
        trailing={
          <button type="button" className={styles.trailingButton} aria-label="Настройки">
            <Icon name="settings" size={20} />
          </button>
        }
      />
      <WipPlaceholder title="Достижения" note="Экран в разработке — следующий блок." />
    </SlideUp>
  );
}
