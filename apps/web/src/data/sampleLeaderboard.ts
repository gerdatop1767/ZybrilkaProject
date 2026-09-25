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
  /** Deterministic avatar color — no stock photos are bundled with the app. */
  avatarColor: string;
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
  xp: number;
}

/** "Лидеры недели" (desktop sidebar) / podium (mobile) — the same top
 * three, just rendered differently per platform. */
export const weeklyLeaders: readonly WeeklyLeader[] = leaderboard.slice(0, 3).map((entry) => ({
  rank: entry.rank,
  username: entry.username,
  avatarColor: entry.avatarColor,
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
