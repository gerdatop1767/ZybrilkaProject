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
import { Icon } from '../../ui/Icon/Icon.js';
import { Button } from '../../ui/Button/Button.js';
import { Chip } from '../../ui/Chip/Chip.js';
import { Input } from '../../ui/Input/Input.js';
import { Avatar } from '../../ui/Leaderboard/Avatar.js';
import { StreakBadge } from '../../ui/RankBadge/StreakBadge.js';
import { LevelBadge } from '../../ui/RankBadge/LevelBadge.js';
import { SlideUp } from '../../ui/motion/motion.js';
import styles from './FriendsMobile.module.css';

type FriendsTab = 'all' | 'online' | 'requests' | 'suggested';

function nextFriendFromRequest(request: FriendRequest): Friend {
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

/** Mobile "Друзья" — same data/logic as FriendsDesktop, stacked into a
 * single column for phone widths, with the same custom back header
 * pattern already used by HelpMobile (no approved mobile screenshot
 * exists for this screen, so this stays a functional adaptation of the
 * desktop layout rather than an invented composition). */
export function FriendsMobile() {
  const { navigate, back } = useNavigation();
  const [tab, setTab] = useState<FriendsTab>('all');
  const [search, setSearch] = useState('');
  const [friendsList, setFriendsList] = useState<readonly Friend[]>(allFriends);
  const [requests, setRequests] = useState<readonly FriendRequest[]>(initialFriendRequests);
  const [sentRequestIds, setSentRequestIds] = useState<ReadonlySet<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const onlineFriends = useMemo(() => friendsList.filter((f) => f.online), [friendsList]);
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

  const tabs: readonly { id: FriendsTab; label: string }[] = [
    { id: 'all', label: `Все друзья (${friendsList.length})` },
    { id: 'online', label: `Онлайн (${onlineFriends.length})` },
    { id: 'requests', label: `Запросы (${requests.length})` },
    { id: 'suggested', label: 'Возможные друзья' },
  ];

  return (
    <SlideUp className={styles.stack}>
      <div className={styles.header}>
        <button type="button" className={styles.backButton} aria-label="Назад" onClick={back}>
          <Icon name="back" size={20} />
        </button>
        <p className="text-body" style={{ fontWeight: 700 }}>
          Друзья
        </p>
      </div>

      <p className="text-body-sm text-secondary">Общайся, сравнивай результаты и учись вместе!</p>

      <Input
        leadingIcon="search"
        placeholder="Найти друга по нику, коду или ссылке..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Найти друга"
      />

      <Button variant="primary" fullWidth onClick={copyInviteLink}>
        <Icon name="friends" size={18} /> {copied ? 'Ссылка скопирована!' : 'Пригласить друга'}
      </Button>

      <div className={styles.tabRow}>
        {tabs.map((t) => (
          <Chip key={t.id} selected={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
          </Chip>
        ))}
      </div>

      {tab !== 'requests' && tab !== 'suggested' && (
        <div className={styles.list}>
          {visibleFriends.length === 0 ? (
            <p className="text-body-sm text-secondary" style={{ textAlign: 'center' }}>
              Ничего не найдено
            </p>
          ) : (
            visibleFriends.map((friend) => (
              <div key={friend.id} className={styles.friendCard}>
                <div className={styles.friendTop}>
                  <Avatar username={friend.username} color={friend.avatarColor} />
                  <div className={styles.friendBody}>
                    <p className="text-body" style={{ fontWeight: 700 }}>
                      {friend.username}
                    </p>
                    <p className="text-body-sm text-secondary">
                      {friend.online ? 'Онлайн' : friend.lastSeen}
                    </p>
                  </div>
                </div>
                <div className={styles.friendStats}>
                  <span className={styles.statChip}>
                    <LevelBadge level={friend.level} size={18} lazy /> {friend.level}
                  </span>
                  <span className={styles.statChip}>
                    <StreakBadge days={friend.streakDays} size={18} lazy /> {friend.streakDays}д
                  </span>
                  <span className={styles.xp}>{friend.xp.toLocaleString('ru-RU')} XP</span>
                </div>
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => navigate({ screen: 'friendProfile', friendId: friend.id })}
                >
                  Профиль <Icon name="arrowRight" size={16} />
                </Button>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'suggested' && (
        <div className={styles.list}>
          {visibleSuggested.map((s) => {
            const sent = sentRequestIds.has(s.id);
            return (
              <div key={s.id} className={styles.friendCard}>
                <div className={styles.friendTop}>
                  <Avatar username={s.username} color={s.avatarColor} />
                  <div className={styles.friendBody}>
                    <p className="text-body" style={{ fontWeight: 700 }}>
                      {s.username}
                    </p>
                    <p className="text-body-sm text-secondary">{s.reason}</p>
                  </div>
                </div>
                <Button
                  variant={sent ? 'secondary' : 'primary'}
                  fullWidth
                  disabled={sent}
                  onClick={() => sendFriendRequest(s.id)}
                >
                  {sent ? 'Заявка отправлена' : 'Добавить'}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <div className={styles.list}>
        <p className="text-h3">Заявки в друзья ({requests.length})</p>
        {requests.length === 0 ? (
          <p className="text-body-sm text-secondary">Заявок пока нет.</p>
        ) : (
          requests.map((request) => (
            <div key={request.id} className={styles.friendCard}>
              <div className={styles.friendTop}>
                <Avatar username={request.user.username} color={request.user.avatarColor} />
                <div className={styles.friendBody}>
                  <p className="text-body" style={{ fontWeight: 700 }}>
                    {request.user.username}
                  </p>
                  <p className="text-body-sm text-secondary">{request.mutualFriends} общих друга</p>
                </div>
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
          ))
        )}
      </div>
    </SlideUp>
  );
}
