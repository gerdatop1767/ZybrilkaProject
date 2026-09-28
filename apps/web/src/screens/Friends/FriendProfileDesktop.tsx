import { BackRow } from '../../ui/BackRow/BackRow.js';
import { WipPlaceholder } from '../../ui/WipPlaceholder/WipPlaceholder.js';

export interface FriendProfileDesktopProps {
  friendId: string;
}

/**
 * Desktop friend profile (/friends/:id) — no social-graph backend
 * exists yet, so there is no real friend to show; this stays a
 * neutral placeholder rather than rendering `data/sampleFriends.ts` as
 * if it were a real friend's data.
 */
export function FriendProfileDesktop({ friendId: _friendId }: FriendProfileDesktopProps) {
  return (
    <div>
      <BackRow to={{ screen: 'friends' }} label="Друзья" />
      <WipPlaceholder title="Друзья" note="Экран в разработке — следующий блок." />
    </div>
  );
}
