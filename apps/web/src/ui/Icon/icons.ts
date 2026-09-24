import {
  Home,
  Dumbbell,
  Swords,
  Trophy,
  BarChart3,
  User,
  Flame,
  Star,
  Check,
  X,
  Lock,
  Target,
  Zap,
  ChevronDown,
  CircleCheck,
  CircleX,
  TriangleAlert,
  Info,
  Loader2,
  type LucideIcon,
} from 'lucide-react';

/**
 * One coherent icon set for the whole product (Design Spec Section 3):
 * outline strokes from lucide-react, with a shared "filled" look
 * available via <Icon filled /> for active/selected states. New icons
 * get added here, never imported ad hoc in a screen — keeps the icon
 * language consistent.
 */
export const icons = {
  home: Home,
  training: Dumbbell,
  battles: Swords,
  achievements: Trophy,
  progress: BarChart3,
  profile: User,
  flame: Flame,
  star: Star,
  check: Check,
  error: X,
  lock: Lock,
  target: Target,
  xp: Zap,
  chevronDown: ChevronDown,
  close: X,
  success: CircleCheck,
  errorCircle: CircleX,
  warning: TriangleAlert,
  info: Info,
  spinner: Loader2,
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof icons;
