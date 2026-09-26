/**
 * Seed "Друзья" content (approved reference: friends_page_reference.png).
 * Shaped so a real backend can replace these arrays/functions without
 * the Friends screens changing — every field here is something a real
 * friends API would plausibly return, not a UI-only shortcut.
 */
import { subjects } from './subjects.js';

export interface FriendSubjectStats {
  subjectId: string;
  subjectName: string;
  accuracyPercent: number;
}

export interface Friend {
  id: string;
  username: string;
  displayName?: string;
  avatarColor: string;
  avatarUrl?: string;
  online: boolean;
  /** Only meaningful when `online` is false. */
  lastSeen?: string;
  level: number;
  xp: number;
  streakDays: number;
  solved: number;
  accuracyPercent: number;
  friendsSince: string;
  mutualFriends: number;
  subjects: readonly FriendSubjectStats[];
}

/** Deterministic 60-99% accuracy per (username, subject) — a stand-in
 * for real per-subject stats until the backend has them, stable across
 * renders/tests rather than random (same technique as
 * sampleLeaderboard.ts's subjectFactor). */
function subjectAccuracy(username: string, subjectId: string): number {
  const seed = `${username}:${subjectId}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return 60 + (hash % 40);
}

function subjectStatsFor(username: string): readonly FriendSubjectStats[] {
  return subjects.slice(0, 4).map((s) => ({
    subjectId: s.id,
    subjectName: s.shortName,
    accuracyPercent: subjectAccuracy(username, s.id),
  }));
}

export const friends: readonly Friend[] = [
  {
    id: 'alex_math',
    username: 'alex_math',
    avatarColor: 'var(--chart-1)',
    online: true,
    level: 23,
    xp: 125430,
    streakDays: 87,
    solved: 2847,
    accuracyPercent: 94,
    friendsSince: '12 марта 2025',
    mutualFriends: 4,
    subjects: [
      { subjectId: 'math', subjectName: 'Математика', accuracyPercent: 87 },
      { subjectId: 'russian', subjectName: 'Русский язык', accuracyPercent: 92 },
      { subjectId: 'english', subjectName: 'Английский', accuracyPercent: 78 },
      { subjectId: 'social', subjectName: 'Обществознание', accuracyPercent: 64 },
    ],
  },
  {
    id: 'diana_ege',
    username: 'Diana_ege',
    avatarColor: 'var(--chart-6)',
    online: true,
    level: 21,
    xp: 98210,
    streakDays: 56,
    solved: 2341,
    accuracyPercent: 92,
    friendsSince: '3 апреля 2025',
    mutualFriends: 6,
    subjects: subjectStatsFor('Diana_ege'),
  },
  {
    id: 'mathegoat',
    username: 'mathegoat',
    avatarColor: 'var(--chart-2)',
    online: false,
    lastSeen: 'Был(а) 2 ч. назад',
    level: 20,
    xp: 86701,
    streakDays: 41,
    solved: 2108,
    accuracyPercent: 90,
    friendsSince: '20 мая 2025',
    mutualFriends: 2,
    subjects: subjectStatsFor('mathegoat'),
  },
  {
    id: 'solv_master',
    username: 'solv_master',
    avatarColor: 'var(--chart-5)',
    online: true,
    level: 19,
    xp: 77540,
    streakDays: 38,
    solved: 1986,
    accuracyPercent: 89,
    friendsSince: '2 июня 2025',
    mutualFriends: 3,
    subjects: subjectStatsFor('solv_master'),
  },
  {
    id: 'ege_victor',
    username: 'ege_victor',
    avatarColor: 'var(--chart-3)',
    online: false,
    lastSeen: 'Был(а) 1 д. назад',
    level: 18,
    xp: 69320,
    streakDays: 34,
    solved: 1842,
    accuracyPercent: 88,
    friendsSince: '15 июля 2025',
    mutualFriends: 1,
    subjects: subjectStatsFor('ege_victor'),
  },
  {
    id: 'liza_english',
    username: 'liza_english',
    avatarColor: 'var(--chart-4)',
    online: true,
    level: 16,
    xp: 54120,
    streakDays: 21,
    solved: 1432,
    accuracyPercent: 85,
    friendsSince: '9 августа 2025',
    mutualFriends: 2,
    subjects: subjectStatsFor('liza_english'),
  },
];

export interface FriendRequest {
  id: string;
  user: {
    id: string;
    username: string;
    avatarColor: string;
    avatarUrl?: string;
  };
  mutualFriends: number;
  createdAt: string;
}

export const initialFriendRequests: readonly FriendRequest[] = [
  {
    id: 'req-kate_ege',
    user: { id: 'kate_ege', username: 'kate_ege', avatarColor: 'var(--chart-6)' },
    mutualFriends: 3,
    createdAt: '2026-09-24',
  },
  {
    id: 'req-maks_math',
    user: { id: 'maks_math', username: 'maks_math', avatarColor: 'var(--chart-1)' },
    mutualFriends: 1,
    createdAt: '2026-09-25',
  },
];

export interface SuggestedFriend {
  id: string;
  username: string;
  avatarColor: string;
  avatarUrl?: string;
  mutualFriends: number;
  reason: string;
}

export const suggestedFriends: readonly SuggestedFriend[] = [
  {
    id: 'nastya_solves',
    username: 'nastya_solves',
    avatarColor: 'var(--chart-3)',
    mutualFriends: 5,
    reason: '5 общих друзей',
  },
  {
    id: 'kirill_ege',
    username: 'kirill_ege',
    avatarColor: 'var(--chart-2)',
    mutualFriends: 2,
    reason: 'Похожие предметы: Математика, Физика',
  },
  {
    id: 'timur_phys',
    username: 'timur_phys',
    avatarColor: 'var(--chart-4)',
    mutualFriends: 0,
    reason: 'Похожая активность в этом месяце',
  },
];

export interface FriendInvite {
  code: string;
  url: string;
}

export const friendInvite: FriendInvite = {
  code: 'AB7F3K',
  url: 'https://zybrilka.ru/invite/AB7F3K',
};

export function getFriendById(id: string): Friend | undefined {
  return friends.find((f) => f.id === id);
}
