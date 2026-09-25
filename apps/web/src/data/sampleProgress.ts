/**
 * Seed progress/achievement/activity content for Home/Progress/Profile
 * (Design Spec Sections 9-11). Demo data for the UI only — not the real
 * stats engine.
 */
export interface TopicMastery {
  topic: string;
  mastery: number;
  weak: boolean;
}

export const topicMastery: readonly TopicMastery[] = [
  { topic: 'Производные', mastery: 82, weak: false },
  { topic: 'Тригонометрия', mastery: 64, weak: false },
  { topic: 'Логарифмы', mastery: 41, weak: true },
  { topic: 'Параметры', mastery: 35, weak: true },
];

export interface ActivityEntry {
  id: string;
  topic: string;
  date: string;
  correct: boolean;
}

export const recentActivity: readonly ActivityEntry[] = [
  { id: 'a1', topic: 'Логарифмы', date: 'Сегодня', correct: false },
  { id: 'a2', topic: 'Производные', date: 'Сегодня', correct: true },
  { id: 'a3', topic: 'Тригонометрия', date: 'Вчера', correct: true },
  { id: 'a4', topic: 'Параметры', date: 'Вчера', correct: false },
];

/** Solved-tasks count per weekday, for the lightweight bar row on Progress. */
export const weeklyActivity: readonly number[] = [4, 7, 2, 9, 5, 3, 8];
export const weekdayLabels: readonly string[] = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export interface AchievementPreview {
  id: string;
  label: string;
  unlocked: boolean;
}

export const achievementPreview: readonly AchievementPreview[] = [
  { id: 'streak-7', label: '7 дней подряд', unlocked: true },
  { id: 'solved-100', label: '100 решено', unlocked: true },
  { id: 'accuracy-85', label: 'Точность 85%', unlocked: false },
  { id: 'diagnostic', label: 'Диагностика', unlocked: true },
];

export const userStats = {
  name: 'Алексей',
  level: 8,
  xp: 320,
  xpToNextLevel: 500,
  streakDays: 12,
  solvedTotal: 248,
  accuracy: 82,
};
