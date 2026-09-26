/**
 * Streak/level badge illustrations — one source of truth for which PNG
 * a given streak/level maps to, shared by every place that shows a
 * user's rank (header StatusChips, /rating, /friends, a friend's
 * profile). Never render a raw number → asset choice inline in a
 * screen; call these instead so changing the thresholds changes every
 * screen at once.
 */

export type StreakTier = 'gray' | 'red-1-9' | 'red-10-29' | 'purple-30-plus';

/** streakDays < 1 → gray, 1-9 → red, 10-29 → stronger red, 30+ → purple. */
export function getStreakTier(streakDays: number): StreakTier {
  if (streakDays >= 30) return 'purple-30-plus';
  if (streakDays >= 10) return 'red-10-29';
  if (streakDays >= 1) return 'red-1-9';
  return 'gray';
}

const streakAssets: Record<StreakTier, string> = {
  gray: '/branding/v2/rank/streak-gray.png',
  'red-1-9': '/branding/v2/rank/streak-red-1-9.png',
  'red-10-29': '/branding/v2/rank/streak-red-10-29.png',
  'purple-30-plus': '/branding/v2/rank/streak-purple-30-plus.png',
};

export function getStreakAsset(streakDays: number): string {
  return streakAssets[getStreakTier(streakDays)];
}

export type LevelTier = 'gold' | 'red' | 'pink';

/** level <= 5 → gold, 6-10 → red, 11+ → pink. Add a new tier here (and
 * to `levelAssets`) if higher levels ever need their own art — nothing
 * else has to change. */
export function getLevelTier(level: number): LevelTier {
  if (level >= 11) return 'pink';
  if (level >= 6) return 'red';
  return 'gold';
}

const levelAssets: Record<LevelTier, string> = {
  gold: '/branding/v2/rank/level-gold.png',
  red: '/branding/v2/rank/level-red.png',
  pink: '/branding/v2/rank/level-pink.png',
};

export function getLevelAsset(level: number): string {
  return levelAssets[getLevelTier(level)];
}
