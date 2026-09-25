import type { BottomNavItem } from './BottomNav.js';

/** The 5-item nav per the approved design (S1 Block 6). */
export const defaultBottomNavItems: readonly BottomNavItem[] = [
  { id: 'home', label: 'Главная', icon: 'home' },
  { id: 'training', label: 'Тренировка', icon: 'training' },
  { id: 'statistics', label: 'Статистика', icon: 'progress' },
  { id: 'achievements', label: 'Достижения', icon: 'achievements' },
  { id: 'profile', label: 'Профиль', icon: 'profile' },
];
