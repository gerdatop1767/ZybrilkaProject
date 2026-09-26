/**
 * Seed Rating/leaderboard content (S1 Block 6, approved design —
 * desktop/mobile 10_rating.png). One canonical ranking shared by both
 * platforms — a real leaderboard API returns a single ranking, not a
 * different one per device — shaped so a real backend can replace this
 * array without the screens changing.
 */
export interface LeaderboardEntry {
  id: string;
  rank: number;
  username: string;
  /** Deterministic avatar color — used whenever `avatarUrl` is absent. */
  avatarColor: string;
  /**
   * The user's Telegram profile photo. `undefined` in this seed data —
   * no real Telegram accounts are linked yet — so every entry falls
   * back to its colored-initials circle until Telegram auth lands.
   */
  avatarUrl?: string;
  level: number;
  solved: number;
  accuracyPercent: number;
  streakDays: number;
  xp: number;
}

export const leaderboard: readonly LeaderboardEntry[] = [
  {
    id: 'u1',
    rank: 1,
    username: 'alex_math',
    avatarColor: 'var(--chart-1)',
    level: 23,
    solved: 2847,
    accuracyPercent: 94,
    streakDays: 87,
    xp: 125430,
  },
  {
    id: 'u2',
    rank: 2,
    username: 'Diana_ege',
    avatarColor: 'var(--chart-6)',
    level: 21,
    solved: 2341,
    accuracyPercent: 92,
    streakDays: 56,
    xp: 98210,
  },
  {
    id: 'u3',
    rank: 3,
    username: 'mathegoat',
    avatarColor: 'var(--chart-2)',
    level: 20,
    solved: 2108,
    accuracyPercent: 90,
    streakDays: 41,
    xp: 86701,
  },
  {
    id: 'u4',
    rank: 4,
    username: 'solver_11',
    avatarColor: 'var(--chart-5)',
    level: 19,
    solved: 1986,
    accuracyPercent: 89,
    streakDays: 38,
    xp: 77540,
  },
  {
    id: 'u5',
    rank: 5,
    username: 'ege_master',
    avatarColor: 'var(--chart-3)',
    level: 18,
    solved: 1842,
    accuracyPercent: 88,
    streakDays: 34,
    xp: 69320,
  },
  {
    id: 'u6',
    rank: 6,
    username: 'lil_math',
    avatarColor: 'var(--chart-1)',
    level: 17,
    solved: 1560,
    accuracyPercent: 86,
    streakDays: 29,
    xp: 60210,
  },
  {
    id: 'u7',
    rank: 7,
    username: 'viktoria_rus',
    avatarColor: 'var(--chart-4)',
    level: 16,
    solved: 1432,
    accuracyPercent: 85,
    streakDays: 27,
    xp: 54890,
  },
  {
    id: 'u8',
    rank: 8,
    username: 'study_hard',
    avatarColor: 'var(--chart-6)',
    level: 16,
    solved: 1381,
    accuracyPercent: 84,
    streakDays: 25,
    xp: 51700,
  },
  {
    id: 'u9',
    rank: 9,
    username: 'nikita_geo',
    avatarColor: 'var(--chart-2)',
    level: 15,
    solved: 1295,
    accuracyPercent: 82,
    streakDays: 22,
    xp: 48110,
  },
  {
    id: 'u10',
    rank: 10,
    username: 'polina_ege',
    avatarColor: 'var(--chart-5)',
    level: 15,
    solved: 1230,
    accuracyPercent: 81,
    streakDays: 20,
    xp: 45980,
  },
];

export const currentUserEntry: LeaderboardEntry = {
  id: 'me',
  rank: 124,
  username: 'Вы',
  avatarColor: 'var(--color-accent-primary)',
  level: 8,
  solved: 248,
  accuracyPercent: 82,
  streakDays: 12,
  xp: 3240,
};

export const totalParticipants = 12648;

export interface WeeklyLeader {
  rank: number;
  username: string;
  avatarColor: string;
  avatarUrl?: string;
  xp: number;
}

/** "Лидеры недели" (desktop sidebar) / podium (mobile) — the same top
 * three, just rendered differently per platform. */
export const weeklyLeaders: readonly WeeklyLeader[] = leaderboard.slice(0, 3).map((entry) => ({
  rank: entry.rank,
  username: entry.username,
  avatarColor: entry.avatarColor,
  avatarUrl: entry.avatarUrl,
  xp: Math.round(entry.xp * 0.42),
}));

export interface SubjectLeader {
  subjectId: string;
  subjectName: string;
  icon: 'topicEquations' | 'subjectSocial' | 'subjectEnglish' | 'subjectInformatics';
  username: string;
  xp: number;
}

/** "Топ по предметам" (desktop sidebar). */
export const subjectLeaders: readonly SubjectLeader[] = [
  {
    subjectId: 'math',
    subjectName: 'Математика',
    icon: 'topicEquations',
    username: 'alex_math',
    xp: 98210,
  },
  {
    subjectId: 'russian',
    subjectName: 'Русский язык',
    icon: 'subjectSocial',
    username: 'Diana_ege',
    xp: 87340,
  },
  {
    subjectId: 'english',
    subjectName: 'Английский язык',
    icon: 'subjectEnglish',
    username: 'lil_english',
    xp: 76530,
  },
  {
    subjectId: 'informatics',
    subjectName: 'Информатика',
    icon: 'subjectInformatics',
    username: 'geek_ege',
    xp: 62880,
  },
];

/** Deterministic 0.55–1.0 multiplier per (username, subject) pair — a
 * stand-in for real per-subject stats until the backend has them, but
 * stable across renders/tests rather than random. */
function subjectFactor(username: string, subjectId: string): number {
  const seed = `${username}:${subjectId}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return 0.55 + (hash % 100) / 220;
}

function scaleEntryForSubject(entry: LeaderboardEntry, subjectId: string): LeaderboardEntry {
  const factor = subjectFactor(entry.username, subjectId);
  return {
    ...entry,
    solved: Math.round(entry.solved * factor * 0.4),
    accuracyPercent: Math.max(50, Math.min(99, Math.round(entry.accuracyPercent * factor))),
    xp: Math.round(entry.xp * factor),
  };
}

/**
 * "По предметам": the same user pool re-ranked by that subject's XP.
 * A real backend would return this pre-ranked; until then it's derived
 * deterministically from the overall leaderboard rather than invented
 * per-subject data that could drift from it.
 */
export function getSubjectLeaderboard(subjectId: string): readonly LeaderboardEntry[] {
  return [...leaderboard, currentUserEntry]
    .map((entry) => scaleEntryForSubject(entry, subjectId))
    .sort((a, b) => b.xp - a.xp)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

/**
 * "Среди друзей" seed circle — a small, separate pool (not a slice of
 * the global leaderboard), since a real friends list is its own social
 * graph the backend will supply later.
 */
const friendsPool: readonly LeaderboardEntry[] = [
  {
    id: 'f1',
    rank: 0,
    username: 'nastya_solves',
    avatarColor: 'var(--chart-3)',
    level: 11,
    solved: 612,
    accuracyPercent: 88,
    streakDays: 24,
    xp: 15420,
  },
  {
    id: 'f2',
    rank: 0,
    username: 'kirill_ege',
    avatarColor: 'var(--chart-2)',
    level: 9,
    solved: 401,
    accuracyPercent: 79,
    streakDays: 9,
    xp: 9870,
  },
  {
    id: 'f3',
    rank: 0,
    username: 'sonya_11b',
    avatarColor: 'var(--chart-6)',
    level: 7,
    solved: 305,
    accuracyPercent: 84,
    streakDays: 15,
    xp: 6540,
  },
  { ...currentUserEntry, id: 'me' },
  {
    id: 'f4',
    rank: 0,
    username: 'timur_phys',
    avatarColor: 'var(--chart-4)',
    level: 6,
    solved: 198,
    accuracyPercent: 76,
    streakDays: 4,
    xp: 4120,
  },
];

export const friendsLeaderboard: readonly LeaderboardEntry[] = friendsPool
  .slice()
  .sort((a, b) => b.xp - a.xp)
  .map((entry, index) => ({ ...entry, rank: index + 1 }));

export const currentUserFriendEntry: LeaderboardEntry = friendsLeaderboard.find(
  (entry) => entry.id === 'me',
)!;
