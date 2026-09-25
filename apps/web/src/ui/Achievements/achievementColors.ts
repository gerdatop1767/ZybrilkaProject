import type { Achievement } from '../../data/sampleAchievements.js';

/**
 * Per-achievement accent color (icon tile / hexagon glow), matching
 * the approved screenshots' per-card colors. Kept out of the data
 * model — this is presentation, not something a real achievements
 * engine would compute.
 */
const colorById: Record<string, string> = {
  'streak-7': 'var(--chart-3)',
  'streak-30': 'var(--color-error)',
  'first-steps': 'var(--color-gold)',
  'tasks-100': 'var(--chart-2)',
  'accuracy-80': 'var(--color-gold)',
  'master-90': 'var(--color-gold)',
  'perfect-week': 'var(--chart-1)',
  'top-100': 'var(--color-gold)',
  speedster: 'var(--chart-6)',
  professional: 'var(--color-gold)',
  'all-topics': 'var(--color-success)',
  'subject-math': 'var(--color-subject-math)',
  'math-task-15': 'var(--color-subject-math)',
  'math-task-11': 'var(--color-subject-math)',
  'subject-russian': 'var(--color-subject-russian)',
  'russian-orthography': 'var(--color-subject-russian)',
  'subject-english': 'var(--color-subject-english)',
};

export function colorForAchievement(achievement: Achievement): string {
  return colorById[achievement.id] ?? 'var(--color-accent-primary-end)';
}
