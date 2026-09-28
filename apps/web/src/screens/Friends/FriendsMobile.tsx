import { useNavigation } from '../../lib/navigation.js';
import { Icon } from '../../ui/Icon/Icon.js';
import { WipPlaceholder } from '../../ui/WipPlaceholder/WipPlaceholder.js';
import { SlideUp } from '../../ui/motion/motion.js';
import styles from './FriendsMobile.module.css';

/**
 * Mobile "Друзья" — no social-graph backend exists yet (friend list,
 * requests, invites), so this stays a neutral placeholder rather than
 * rendering `data/sampleFriends.ts` — with locally-simulated
 * accept/reject — as if it were a real friends system.
 */
export function FriendsMobile() {
  const { back } = useNavigation();

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

      <WipPlaceholder title="Друзья" note="Экран в разработке — следующий блок." />
    </SlideUp>
  );
}
