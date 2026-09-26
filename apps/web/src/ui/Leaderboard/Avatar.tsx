import { useState } from 'react';
import styles from './Avatar.module.css';

export interface AvatarProps {
  username: string;
  color: string;
  size?: number;
  /**
   * The user's Telegram profile photo, once Telegram auth is wired up.
   * `undefined` for every seed entry today — no real photos exist yet.
   * Falls back to the colored-initials circle below on a missing URL
   * or a failed/broken image load, so a dead link never renders empty.
   */
  avatarUrl?: string;
}

/**
 * Leaderboard avatar: shows the user's Telegram photo when one is
 * available, otherwise a deterministic colored circle with their first
 * letter — never an invented stock photo.
 */
export function Avatar({ username, color, size = 40, avatarUrl }: AvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const initial = username.trim().charAt(0).toUpperCase();

  if (avatarUrl && !imageFailed) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className={styles.avatarPhoto}
        style={{ width: size, height: size }}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setImageFailed(true)}
      />
    );
  }

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
