import type { BottomNavItem } from './BottomNav.js';

/**
 * The 5-item nav. The second slot opens "Мои ошибки" directly (fix
 * audit Block 2) — a real, high-value training mode — rather than a
 * generic "Тренировка" tab; the full training entry point stays
 * reachable from Home and the menu.
 */
export const defaultBottomNavItems: readonly BottomNavItem[] = [
  { id: 'home', label: 'Главная', icon: 'home' },
  { id: 'mistakes', label: 'Мои ошибки', icon: 'mistakes' },
  { id: 'statistics', label: 'Статистика', icon: 'progress' },
  { id: 'achievements', label: 'Достижения', icon: 'achievements' },
  { id: 'profile', label: 'Профиль', icon: 'profile' },
];
