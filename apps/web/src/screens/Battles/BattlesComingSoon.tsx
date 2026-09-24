import { Icon } from '../../ui/Icon/Icon.js';
import { FadeIn } from '../../ui/motion/motion.js';
import styles from './BattlesComingSoon.module.css';

/**
 * Battles is out of this block's scope (no real matchmaking/battle
 * logic yet). BottomNav already ships a Битвы tab, so this is a proper
 * empty state rather than a dead button — real battles UI arrives in a
 * later block.
 */
export function BattlesComingSoon() {
  return (
    <FadeIn className={styles.stack}>
      <span className={styles.icon}>
        <Icon name="battles" size={32} />
      </span>
      <h1 className="text-h2">Битвы скоро здесь</h1>
      <p className="text-body text-secondary">
        1×1 тренировки на скорость и точность появятся в одном из следующих блоков.
      </p>
    </FadeIn>
  );
}
