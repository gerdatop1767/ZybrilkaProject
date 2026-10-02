import type { BottomNavItem } from './BottomNav.js';

/**
 * The 5-item nav (matches the approved reference,
 * profile_mobile_target.jpeg): Главная / Задания / Статистика /
 * Достижения / Профиль. "Мои ошибки" stays reachable from Statistics'
 * own link and the Menu drawer — it's no longer a tab slot, but it was
 * never removed as a feature.
 */
export const defaultBottomNavItems: readonly BottomNavItem[] = [
  { id: 'home', label: 'Главная', icon: 'home' },
  { id: 'training', label: 'Задания', icon: 'training' },
  { id: 'statistics', label: 'Статистика', icon: 'progress' },
  { id: 'achievements', label: 'Достижения', icon: 'achievements' },
  { id: 'profile', label: 'Профиль', icon: 'profile' },
];
