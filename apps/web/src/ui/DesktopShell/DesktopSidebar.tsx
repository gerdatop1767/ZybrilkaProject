import { useNavigation, type Route } from '../../lib/navigation.js';
import { Icon } from '../Icon/Icon.js';
import type { IconName } from '../Icon/icons.js';
import { clsx } from '../../lib/clsx.js';
import styles from './DesktopShell.module.css';

interface SidebarItem {
  id: string;
  label: string;
  icon: IconName;
  route: Route;
}

const sidebarItems: readonly SidebarItem[] = [
  { id: 'home', label: 'Главная', icon: 'home', route: { screen: 'home' } },
  {
    id: 'learningCenter',
    label: 'Учебный центр',
    icon: 'topic',
    route: { screen: 'learningCenter' },
  },
  {
    id: 'subjectCatalog',
    label: 'Предметы',
    icon: 'grid',
    route: { screen: 'subjectCatalog' },
  },
  { id: 'statistics', label: 'Статистика', icon: 'progress', route: { screen: 'statistics' } },
  { id: 'mistakes', label: 'Мои ошибки', icon: 'warning', route: { screen: 'mistakes' } },
  {
    id: 'achievements',
    label: 'Достижения',
    icon: 'achievements',
    route: { screen: 'achievements' },
  },
  { id: 'rating', label: 'Рейтинг', icon: 'crown', route: { screen: 'rating' } },
  { id: 'about', label: 'О проекте', icon: 'info', route: { screen: 'about' } },
];

/**
 * Desktop's persistent left sidebar (S1 Block 6, approved design) —
 * every desktop screen except Home/Subject-catalog's marketing top
 * bar uses this. "Учебный центр" routes to the still-unreferenced
 * screen and renders the neutral fallback until its screenshot
 * arrives (see screens/LearningCenter/DesktopFallback.tsx).
 */
export function DesktopSidebar() {
  const { tab, overlay, navigate } = useNavigation();
  const currentId = overlay?.screen ?? tab;

  return (
    <nav className={styles.sidebar} aria-label="Zybrilka">
      {sidebarItems.map((item) => {
        const isActive = item.id === currentId;
        return (
          <button
            key={item.id}
            type="button"
            className={clsx(styles.sidebarItem, isActive && styles.sidebarItemActive)}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => navigate(item.route)}
          >
            <Icon name={item.icon} size={20} filled={isActive} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
