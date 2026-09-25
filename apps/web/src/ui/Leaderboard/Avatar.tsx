import styles from './Avatar.module.css';

export interface AvatarProps {
  username: string;
  color: string;
  size?: number;
}

/**
 * Colored initials avatar (Rating screens): no stock photos ship with
 * the app, so each leaderboard entry gets a deterministic colored
 * circle with its first letter instead of an invented face.
 */
export function Avatar({ username, color, size = 40 }: AvatarProps) {
  const initial = username.trim().charAt(0).toUpperCase();
  return (
    <span
      className={styles.avatar}
      style={{ width: size, height: size, background: color, fontSize: size * 0.42 }}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}
