/**
 * Seed Achievements content (S1 Block 6, approved design —
 * desktop/mobile 09_achievements.png). Shaped so a real achievements
 * engine can compute `progress`/`unlocked` from attempts, XP, streak,
 * solved tasks, training sessions, battles and mistakes later without
 * this module's consumers (the two screens) changing.
 */
import type { IconName } from '../ui/Icon/icons.js';

export type AchievementCategory = 'general' | 'math' | 'russian' | 'english' | 'streak';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: IconName;
  category: AchievementCategory;
  /** 0-100 share of active users who hold this achievement — data only;
   * shown in UI only where the approved screenshot actually displays it. */
  rarityPercent: number;
  progress: number;
  target: number;
  unlocked: boolean;
  /** ISO date, set only when `unlocked` is true. */
  unlockedAt: string | null;
  rewardXP: number;
}

export const achievements: readonly Achievement[] = [
  // Streak
  {
    id: 'streak-7',
    title: 'Серия 7 дней',
    description: 'Занимайся 7 дней подряд',
    icon: 'flame',
    category: 'streak',
    rarityPercent: 34,
    progress: 7,
    target: 7,
    unlocked: true,
    unlockedAt: '2026-09-18',
    rewardXP: 50,
  },
  {
    id: 'streak-30',
    title: 'Серия 30 дней',
    description: 'Занимайся 30 дней подряд',
    icon: 'calendar',
    category: 'streak',
    rarityPercent: 8.4,
    progress: 12,
    target: 30,
    unlocked: false,
    unlockedAt: null,
    rewardXP: 150,
  },

  // General
  {
    id: 'first-steps',
    title: 'Первые шаги',
    description: 'Реши 10 заданий',
    icon: 'xp',
    category: 'general',
    rarityPercent: 92,
    progress: 10,
    target: 10,
    unlocked: true,
    unlockedAt: '2026-09-12',
    rewardXP: 10,
  },
  {
    id: 'tasks-100',
    title: '100 заданий',
    description: 'Реши 100 заданий',
    icon: 'target',
    category: 'general',
    rarityPercent: 41,
    progress: 87,
    target: 100,
    unlocked: false,
    unlockedAt: null,
    rewardXP: 100,
  },
  {
    id: 'accuracy-80',
    title: 'Точность 80%',
    description: 'Достигни 80% точности',
    icon: 'star',
    category: 'general',
    rarityPercent: 29,
    progress: 80,
    target: 80,
    unlocked: true,
    unlockedAt: '2026-09-20',
    rewardXP: 80,
  },
  {
    id: 'master-90',
    title: 'Мастер',
    description: 'Достигни 90% правильных ответов',
    icon: 'star',
    category: 'general',
    rarityPercent: 11,
    progress: 78,
    target: 90,
    unlocked: false,
    unlockedAt: null,
    rewardXP: 200,
  },
  {
    id: 'perfect-week',
    title: 'Идеальная неделя',
    description: '100% правильных ответов 7 дней подряд',
    icon: 'gem',
    category: 'general',
    rarityPercent: 6.2,
    progress: 3,
    target: 7,
    unlocked: false,
    unlockedAt: null,
    rewardXP: 150,
  },
  {
    id: 'top-100',
    title: 'Топ-100',
    description: 'Попади в топ-100 рейтинга',
    icon: 'crown',
    category: 'general',
    rarityPercent: 2.1,
    progress: 0,
    target: 1,
    unlocked: false,
    unlockedAt: null,
    rewardXP: 300,
  },
  {
    id: 'speedster',
    title: 'Быстрый ум',
    description: 'Реши 50 заданий менее чем за 2 минуты',
    icon: 'rocket',
    category: 'general',
    rarityPercent: 18,
    progress: 50,
    target: 50,
    unlocked: true,
    unlockedAt: '2026-09-19',
    rewardXP: 120,
  },
  {
    id: 'professional',
    title: 'Профессионал',
    description: 'Реши 500 заданий',
    icon: 'achievements',
    category: 'general',
    rarityPercent: 9,
    progress: 187,
    target: 500,
    unlocked: false,
    unlockedAt: null,
    rewardXP: 500,
  },
  {
    id: 'all-topics',
    title: 'Все темы',
    description: 'Реши хотя бы одну задачу из каждой темы',
    icon: 'topic',
    category: 'general',
    rarityPercent: 22,
    progress: 19,
    target: 19,
    unlocked: true,
    unlockedAt: '2026-09-21',
    rewardXP: 90,
  },

  // Math
  {
    id: 'subject-math',
    title: 'Математик',
    description: 'Реши 50 заданий по математике',
    icon: 'topicEquations',
    category: 'math',
    rarityPercent: 26,
    progress: 50,
    target: 50,
    unlocked: true,
    unlockedAt: '2026-09-14',
    rewardXP: 150,
  },
  {
    id: 'math-task-15',
    title: 'Мастер №15',
    description: 'Реши 50 заданий №15',
    icon: 'topicEquations',
    category: 'math',
    rarityPercent: 14,
    progress: 28,
    target: 50,
    unlocked: false,
    unlockedAt: null,
    rewardXP: 120,
  },
  {
    id: 'math-task-11',
    title: 'Мастер №11',
    description: 'Реши 50 заданий №11',
    icon: 'topicFunctions',
    category: 'math',
    rarityPercent: 12,
    progress: 0,
    target: 50,
    unlocked: false,
    unlockedAt: null,
    rewardXP: 120,
  },

  // Russian
  {
    id: 'subject-russian',
    title: 'Грамотность',
    description: 'Реши 50 заданий по русскому языку',
    icon: 'topic',
    category: 'russian',
    rarityPercent: 31,
    progress: 50,
    target: 50,
    unlocked: true,
    unlockedAt: '2026-09-16',
    rewardXP: 150,
  },
  {
    id: 'russian-orthography',
    title: 'Мастер орфографии',
    description: 'Реши 30 заданий по правописанию',
    icon: 'topic',
    category: 'russian',
    rarityPercent: 17,
    progress: 0,
    target: 30,
    unlocked: false,
    unlockedAt: null,
    rewardXP: 90,
  },

  // English
  {
    id: 'subject-english',
    title: 'Полиглот',
    description: 'Реши 50 заданий по английскому языку',
    icon: 'subjectEnglish',
    category: 'english',
    rarityPercent: 19,
    progress: 32,
    target: 50,
    unlocked: false,
    unlockedAt: null,
    rewardXP: 150,
  },
];

export interface AchievementsSummary {
  total: number;
  unlockedCount: number;
  unlockedPercent: number;
}

/** Computed from `achievements`, never hardcoded. */
export function computeAchievementsSummary(
  items: readonly Achievement[] = achievements,
): AchievementsSummary {
  const total = items.length;
  const unlockedCount = items.filter((a) => a.unlocked).length;
  return {
    total,
    unlockedCount,
    unlockedPercent: total ? Math.round((unlockedCount / total) * 100) : 0,
  };
}

export function countByCategory(
  category: AchievementCategory,
  items: readonly Achievement[] = achievements,
): number {
  return items.filter((a) => a.category === category).length;
}
