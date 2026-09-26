import { mainTabIds, useNavigation, type MainTabId } from '../../lib/navigation.js';
import { Icon } from '../Icon/Icon.js';
import styles from './BackRow.module.css';

const tabLabels: Record<MainTabId, string> = {
  home: 'Главная',
  training: 'Тренировка',
  statistics: 'Статистика',
  achievements: 'Достижения',
  profile: 'Профиль',
};

/**
 * Compact back navigation for desktop overlay screens (approved
 * reference: "Учебный центр"/"Предметы"). Closes the current overlay
 * via `back()`, returning to whichever tab is underneath it — never
 * hardcoded to Home — and labels itself with that tab's name.
 */
export function BackRow() {
  const { tab, back } = useNavigation();
  const label = mainTabIds.includes(tab) ? tabLabels[tab] : tabLabels.home;

  return (
    <button type="button" className={styles.backRow} onClick={back}>
      <span className={styles.backIcon}>
        <Icon name="back" size={16} />
      </span>
      {label}
    </button>
  );
}
