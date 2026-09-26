import { useMemo, useState } from 'react';
import { useNavigation } from '../../lib/navigation.js';
import {
  friends as allFriends,
  initialFriendRequests,
  suggestedFriends,
  friendInvite,
  type Friend,
  type FriendRequest,
} from '../../data/sampleFriends.js';
import { BackRow } from '../../ui/BackRow/BackRow.js';
import { Card } from '../../ui/Card/Card.js';
import { Button } from '../../ui/Button/Button.js';
import { Chip } from '../../ui/Chip/Chip.js';
import { Input } from '../../ui/Input/Input.js';
import { Icon } from '../../ui/Icon/Icon.js';
import { Avatar } from '../../ui/Leaderboard/Avatar.js';
import { ProgressBar } from '../../ui/Progress/ProgressBar.js';
import { StreakBadge } from '../../ui/RankBadge/StreakBadge.js';
import { LevelBadge } from '../../ui/RankBadge/LevelBadge.js';
import { FadeIn } from '../../ui/motion/motion.js';
import { clsx } from '../../lib/clsx.js';
import styles from './FriendsDesktop.module.css';

type FriendsTab = 'all' | 'online' | 'requests' | 'suggested';

const medalColor: Record<number, string> = {
  1: 'var(--color-gold)',
  2: 'var(--color-text-secondary)',
  3: '#cd7f32',
};

function nextFriendFromRequest(request: FriendRequest): Friend {
  // A freshly-accepted request has no history with this account yet —
  // an honest starting point, not invented stats to make the row look
  // populated like the seeded friends above.
  return {
    id: request.user.id,
    username: request.user.username,
    avatarColor: request.user.avatarColor,
    avatarUrl: request.user.avatarUrl,
    online: false,
    lastSeen: 'Только что добавлен(а)',
    level: 1,
    xp: 0,
    streakDays: 0,
    solved: 0,
    accuracyPercent: 0,
    friendsSince: 'Сегодня',
    mutualFriends: request.mutualFriends,
    subjects: [],
  };
}

/**
 * Desktop "Друзья" (approved reference: friends_page_reference.png) —
 * a real social screen over `data/sampleFriends.ts`: search, tab
 * filters, friend requests (accept/reject as real local state), an
 * invite link with copy/share, a friends-only XP ranking, and a
 * subject-accuracy snapshot for the top friend. Level/streak badges
 * reuse the exact same `LevelBadge`/`StreakBadge` as the header and
 * /rating — never a second icon system for the same data.
 */
export function FriendsDesktop() {
  const { navigate } = useNavigation();
  const [tab, setTab] = useState<FriendsTab>('all');
  const [search, setSearch] = useState('');
  const [friendsList, setFriendsList] = useState<readonly Friend[]>(allFriends);
  const [requests, setRequests] = useState<readonly FriendRequest[]>(initialFriendRequests);
  const [sentRequestIds, setSentRequestIds] = useState<ReadonlySet<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const onlineFriends = useMemo(() => friendsList.filter((f) => f.online), [friendsList]);
  const rankedByXp = useMemo(() => [...friendsList].sort((a, b) => b.xp - a.xp), [friendsList]);
  const topFriend = rankedByXp[0];

  const query = search.trim().toLowerCase();
  const baseList = tab === 'online' ? onlineFriends : friendsList;
  const visibleFriends = query
    ? baseList.filter((f) => f.username.toLowerCase().includes(query))
    : baseList;
  const visibleSuggested = query
    ? suggestedFriends.filter((s) => s.username.toLowerCase().includes(query))
    : suggestedFriends;

  function acceptRequest(request: FriendRequest) {
    setRequests((prev) => prev.filter((r) => r.id !== request.id));
    setFriendsList((prev) => [...prev, nextFriendFromRequest(request)]);
  }

  function rejectRequest(requestId: string) {
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  }

  function sendFriendRequest(id: string) {
    setSentRequestIds((prev) => new Set(prev).add(id));
  }

  async function copyInviteLink() {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(friendInvite.url);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function shareInviteLink() {
    if (navigator.share) {
      try {
        await navigator.share({ url: friendInvite.url, title: 'Zybrilka' });
        return;
      } catch {
        // User cancelled the share sheet — fall through to copy.
      }
    }
    await copyInviteLink();
  }

  const tabs: readonly { id: FriendsTab; label: string; icon: 'friends' | 'search' }[] = [
    { id: 'all', label: `Все друзья (${friendsList.length})`, icon: 'friends' },
    { id: 'online', label: `Онлайн (${onlineFriends.length})`, icon: 'friends' },
    { id: 'requests', label: `Запросы (${requests.length})`, icon: 'friends' },
    { id: 'suggested', label: 'Возможные друзья', icon: 'friends' },
  ];

  return (
    <FadeIn className={styles.page}>
      <BackRow to={{ screen: 'home' }} label="Главная" />

      <div className={styles.headRow}>
        <h1 className="text-h1">Друзья</h1>
      </div>
      <p className="text-body-sm text-secondary">Общайся, сравнивай результаты и учись вместе!</p>

      <div className={styles.searchRow}>
        <Input
          leadingIcon="search"
          placeholder="Найти друга по нику, коду или ссылке..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Найти друга"
          wrapperClassName={styles.searchField}
        />
        <Button variant="primary" className={styles.inviteButton} onClick={copyInviteLink}>
          <Icon name="friends" size={18} /> {copied ? 'Ссылка скопирована!' : 'Пригласить друга'}
        </Button>
      </div>

      <div className={styles.tabRow}>
        {tabs.map((t) => (
          <Chip key={t.id} selected={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
          </Chip>
        ))}
      </div>

      <div className={styles.grid}>
        <div className={styles.main}>
          {tab !== 'requests' && tab !== 'suggested' && (
            <Card className={styles.listCard}>
              {visibleFriends.length === 0 ? (
                <EmptySearchState />
              ) : (
                <div className={styles.list}>
                  {visibleFriends.map((friend, index) => (
                    <FadeIn key={friend.id} delayMs={index * 30} className={styles.friendRow}>
                      <span className={styles.rank}>{index + 1}</span>
                      <div className={styles.userCell}>
                        <Avatar
                          username={friend.username}
                          color={friend.avatarColor}
                          avatarUrl={friend.avatarUrl}
                        />
                        <div className={styles.friendBody}>
                          <p
                            className={clsx('text-body', styles.username)}
                            style={{ fontWeight: 700 }}
                          >
                            {friend.username}
                          </p>
                          <p className={clsx('text-body-sm', styles.statusRow)}>
                            {friend.online ? (
                              <>
                                <span className={styles.onlineDot} aria-hidden="true" />
                                <span className={styles.onlineText}>Онлайн</span>
                              </>
                            ) : (
                              <span className={clsx('text-secondary', styles.lastSeen)}>
                                {friend.lastSeen}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <span className={styles.statChip}>
                        <LevelBadge level={friend.level} size={20} lazy />
                        {friend.level}
                      </span>
                      <span className={styles.statChip}>
                        <StreakBadge days={friend.streakDays} size={20} lazy />
                        {friend.streakDays} дней
                      </span>
                      <span className={styles.xp}>{friend.xp.toLocaleString('ru-RU')} XP</span>
                      <Button
                        variant="secondary"
                        className={styles.profileButton}
                        onClick={() => navigate({ screen: 'friendProfile', friendId: friend.id })}
                      >
                        Профиль <Icon name="arrowRight" size={16} className={styles.arrowIcon} />
                      </Button>
                    </FadeIn>
                  ))}
                </div>
              )}
            </Card>
          )}

          {tab === 'suggested' && (
            <Card className={styles.listCard}>
              {visibleSuggested.length === 0 ? (
                <EmptySearchState />
              ) : (
                <div className={styles.list}>
                  {visibleSuggested.map((s, index) => {
                    const sent = sentRequestIds.has(s.id);
                    return (
                      <FadeIn key={s.id} delayMs={index * 30} className={styles.suggestedRow}>
                        <Avatar username={s.username} color={s.avatarColor} />
                        <div className={styles.friendBody}>
                          <p className="text-body" style={{ fontWeight: 700 }}>
                            {s.username}
                          </p>
                          <p className="text-body-sm text-secondary">{s.reason}</p>
                        </div>
                        <Button
                          variant={sent ? 'secondary' : 'primary'}
                          disabled={sent}
                          onClick={() => sendFriendRequest(s.id)}
                        >
                          {sent ? 'Заявка отправлена' : 'Добавить'}
                        </Button>
                      </FadeIn>
                    );
                  })}
                </div>
              )}
            </Card>
          )}

          {tab === 'requests' && (
            <Card className={styles.listCard}>
              {requests.length === 0 ? (
                <p className="text-body-sm text-secondary">Заявок пока нет.</p>
              ) : (
                <div className={styles.list}>
                  {requests.map((request, index) => (
                    <FadeIn key={request.id} delayMs={index * 30} className={styles.requestRow}>
                      <Avatar username={request.user.username} color={request.user.avatarColor} />
                      <div className={styles.friendBody}>
                        <p className="text-body" style={{ fontWeight: 700 }}>
                          {request.user.username}
                        </p>
                        <p className="text-body-sm text-secondary">
                          {request.mutualFriends} общих друга
                        </p>
                      </div>
                      <div className={styles.requestActions}>
                        <Button variant="primary" onClick={() => acceptRequest(request)}>
                          Принять
                        </Button>
                        <Button variant="secondary" onClick={() => rejectRequest(request.id)}>
                          Отклонить
                        </Button>
                      </div>
                    </FadeIn>
                  ))}
                </div>
              )}
            </Card>
          )}

          {tab !== 'requests' && (
            <Card className={styles.requestsCard}>
              <div className={styles.sectionHeaderRow}>
                <p className="text-h3">Заявки в друзья ({requests.length})</p>
                <button
                  type="button"
                  className={styles.linkButton}
                  onClick={() => setTab('requests')}
                >
                  Все →
                </button>
              </div>
              {requests.length === 0 ? (
                <p className="text-body-sm text-secondary" style={{ marginTop: 'var(--space-2)' }}>
                  Заявок пока нет.
                </p>
              ) : (
                <div className={styles.list} style={{ marginTop: 'var(--space-3)' }}>
                  {requests.map((request) => (
                    <div key={request.id} className={styles.requestRow}>
                      <Avatar username={request.user.username} color={request.user.avatarColor} />
                      <div className={styles.friendBody}>
                        <p className="text-body-sm" style={{ fontWeight: 700 }}>
                          {request.user.username}
                        </p>
                        <p className="text-body-sm text-secondary">
                          {request.mutualFriends} общих друга
                        </p>
                      </div>
                      <div className={styles.requestActions}>
                        <Button variant="primary" onClick={() => acceptRequest(request)}>
                          Принять
                        </Button>
                        <Button variant="secondary" onClick={() => rejectRequest(request.id)}>
                          Отклонить
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>

        <div className={styles.sidebar}>
          <FadeIn delayMs={60}>
            <Card className={styles.inviteCard}>
              <div className={styles.inviteHead}>
                <span className={styles.inviteIcon}>
                  <Icon name="friends" size={22} />
                </span>
                <div>
                  <p className="text-h3">Пригласить друзей</p>
                  <p className="text-body-sm text-secondary">
                    Отправь ссылку другу, чтобы он добавился в твой список друзей
                  </p>
                </div>
              </div>
              <div className={styles.inviteUrlRow}>
                <input
                  type="text"
                  readOnly
                  value={friendInvite.url}
                  className={styles.inviteUrlInput}
                  aria-label="Ссылка приглашения"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <button
                  type="button"
                  className={styles.copyIconButton}
                  aria-label="Скопировать ссылку"
                  onClick={copyInviteLink}
                >
                  <Icon name="copy" size={16} />
                </button>
              </div>
              <Button variant="primary" fullWidth onClick={copyInviteLink}>
                <Icon name="copy" size={16} /> {copied ? 'Скопировано!' : 'Скопировать ссылку'}
              </Button>
              <Button variant="secondary" fullWidth onClick={shareInviteLink}>
                <Icon name="share" size={16} /> Поделиться
              </Button>
            </Card>
          </FadeIn>

          <FadeIn delayMs={100}>
            <Card>
              <div className={styles.sectionHeaderRow}>
                <p className="text-h3">Рейтинг друзей</p>
                <button
                  type="button"
                  className={styles.linkButton}
                  onClick={() => navigate({ screen: 'rating' })}
                >
                  Все →
                </button>
              </div>
              <div className={styles.miniList} style={{ marginTop: 'var(--space-3)' }}>
                {rankedByXp.slice(0, 5).map((friend, index) => (
                  <div key={friend.id} className={styles.miniRow}>
                    <span className={styles.miniRank}>{index + 1}</span>
                    {index < 3 && (
                      <span style={{ color: medalColor[index + 1] }}>
                        <Icon name="crown" size={16} />
                      </span>
                    )}
                    <Avatar
                      username={friend.username}
                      color={friend.avatarColor}
                      avatarUrl={friend.avatarUrl}
                      size={32}
                    />
                    <span className={styles.miniBody}>{friend.username}</span>
                    <span className={styles.miniXp}>{friend.xp.toLocaleString('ru-RU')} XP</span>
                  </div>
                ))}
              </div>
            </Card>
          </FadeIn>

          {topFriend && (
            <FadeIn delayMs={140}>
              <Card>
                <div className={styles.sectionHeaderRow}>
                  <span className={styles.friendStatsHead}>
                    <Avatar
                      username={topFriend.username}
                      color={topFriend.avatarColor}
                      avatarUrl={topFriend.avatarUrl}
                      size={24}
                    />
                    <p className="text-h3">Статистика друга</p>
                  </span>
                  <button
                    type="button"
                    className={styles.linkButton}
                    onClick={() => navigate({ screen: 'friendProfile', friendId: topFriend.id })}
                  >
                    Смотреть профиль →
                  </button>
                </div>
                <div className={styles.subjectList} style={{ marginTop: 'var(--space-3)' }}>
                  {topFriend.subjects.map((s) => (
                    <div key={s.subjectId} className={styles.subjectRow}>
                      <span className="text-body-sm" style={{ width: '9rem', flexShrink: 0 }}>
                        {s.subjectName}
                      </span>
                      <ProgressBar value={s.accuracyPercent} className={styles.subjectBar} />
                      <span className={styles.subjectPercent}>{s.accuracyPercent}%</span>
                    </div>
                  ))}
                </div>
              </Card>
            </FadeIn>
          )}
        </div>
      </div>
    </FadeIn>
  );
}

function EmptySearchState() {
  return (
    <div className={styles.emptyState}>
      <Icon name="emptyState" size={32} className={styles.emptyIcon} />
      <p className="text-body-sm text-secondary">Ничего не найдено</p>
    </div>
  );
}
