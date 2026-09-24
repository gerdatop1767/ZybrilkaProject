import { subjects } from '../data/subjects.js';
import { recentActivity, achievementPreview, userStats } from '../data/sampleProgress.js';

/**
 * Shared, realistic content for the 10 Home-screen visual concepts
 * (S1 Block 5 design exploration). Pulled from the same sample data
 * the production screens use — no lorem ipsum, no placeholder copy —
 * so every concept is judged on composition, not on differing text.
 */
export const explorationContent = {
  logoSrc: '/branding/zybrilka-logo.png',
  greeting: `Привет, ${userStats.name}!`,
  subtext: 'Сегодня ты ближе к своей цели, чем вчера. Продолжаем!',
  cta: 'Продолжить тренировку',
  userStats,
  subjects,
  recentActivity: recentActivity.slice(0, 3),
  achievements: achievementPreview,
};
