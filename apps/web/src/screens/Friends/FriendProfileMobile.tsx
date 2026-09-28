import { useNavigation } from '../../lib/navigation.js';
import { Icon } from '../../ui/Icon/Icon.js';
import { WipPlaceholder } from '../../ui/WipPlaceholder/WipPlaceholder.js';
import styles from './FriendProfileMobile.module.css';

export interface FriendProfileMobileProps {
  friendId: string;
}

/**
 * Mobile friend profile (/friends/:id) — no social-graph backend
 * exists yet, so there is no real friend to show; this stays a
 * neutral placeholder rather than rendering `data/sampleFriends.ts` as
 * if it were a real friend's data.
 */
export function FriendProfileMobile({ friendId: _friendId }: FriendProfileMobileProps) {
  const { back } = useNavigation();

  return (
    <div className={styles.stack}>
      <div className={styles.header}>
        <button type="button" className={styles.backButton} aria-label="Назад" onClick={back}>
          <Icon name="back" size={20} />
        </button>
        <p className="text-body" style={{ fontWeight: 700 }}>
          Друзья
        </p>
      </div>
      <WipPlaceholder title="Друзья" note="Экран в разработке — следующий блок." />
    </div>
  );
}
