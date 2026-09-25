import { Icon } from '../Icon/Icon.js';
import styles from './WipPlaceholder.module.css';

export interface WipPlaceholderProps {
  title: string;
  note?: string;
}

/**
 * Two distinct reasons a screen can render this:
 *
 * 1. Not yet built in this pass (S1 Block 6 is landing screen-by-screen;
 *    a real screenshot exists, the composition just isn't implemented
 *    yet) — `note` says so plainly.
 * 2. The approved reference itself is missing (desktop "Учебный
 *    центр" / desktop "Меню") — per instructions this must stay a
 *    neutral technical placeholder, never a guessed composition, until
 *    the screenshot is provided.
 *
 * Either way this is deliberately plain — never styled to look like a
 * finished screen — so it's never mistaken for approved design.
 */
export function WipPlaceholder({ title, note }: WipPlaceholderProps) {
  return (
    <div className={styles.wrap}>
      <Icon name="settings" size={28} className={styles.icon} />
      <p className="text-h3">{title}</p>
      {note && <p className="text-body-sm text-secondary">{note}</p>}
    </div>
  );
}
