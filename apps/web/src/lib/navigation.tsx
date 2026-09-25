import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

/**
 * The persistent tabs behind the bottom nav (mobile) / sidebar
 * (desktop) — S1 Block 6, approved design. The screenshots show a
 * couple of different labels for slot 2/4 across mocks (Учёба vs
 * Тренировка, Достижения vs Ошибки vs Рейтинг); a real nav needs one
 * fixed set, so this uses the pattern that recurs across the most
 * screens. Мои ошибки / Рейтинг / О проекте stay reachable from Home
 * and the Menu overlay rather than living in the tab bar itself.
 */
export type MainTabId = 'home' | 'training' | 'statistics' | 'achievements' | 'profile';

export const mainTabIds: readonly MainTabId[] = [
  'home',
  'training',
  'statistics',
  'achievements',
  'profile',
];

/**
 * Full-screen overlays reached from a tab. Task/Result hide the tab
 * chrome entirely (mobile bottom nav / desktop sidebar) so the task
 * gets full screen real estate, matching the approved screenshots.
 */
export type OverlayRoute =
  | { screen: 'onboarding' }
  | { screen: 'learningCenter' }
  | { screen: 'subjectCatalog' }
  | { screen: 'subject'; subjectId: string }
  | { screen: 'task'; subjectId: string; taskNumber: number; taskId: string }
  | {
      screen: 'result';
      subjectId: string;
      taskNumber: number;
      taskId: string;
      correct: boolean;
      /** The user's actual submitted answer — Result must show what
       * they really typed, never a placeholder. */
      userAnswer: string;
    }
  | { screen: 'mistakes' }
  | { screen: 'rating' }
  | { screen: 'about' }
  | { screen: 'menu' }
  | { screen: 'favorites' }
  | { screen: 'mockExams' }
  | { screen: 'topics' }
  | { screen: 'friends' }
  | { screen: 'settings' };

export type Route = { screen: MainTabId } | OverlayRoute;

interface NavigationContextValue {
  /** The currently selected tab (persists under an open overlay). */
  tab: MainTabId;
  /** The active overlay, or null when a tab screen is showing. */
  overlay: OverlayRoute | null;
  navigate: (route: Route) => void;
  /** Closes the current overlay, returning to its underlying tab. */
  back: () => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

/**
 * Lightweight typed navigation: a router this small doesn't need a
 * routing library. Tabs are mutually exclusive and drive the nav's
 * active state; everything else is an overlay on top of whichever tab
 * is underneath, dismissed by `back()`.
 */
export function NavigationProvider({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<MainTabId>('home');
  const [overlay, setOverlay] = useState<OverlayRoute | null>(null);

  const navigate = useCallback((route: Route) => {
    if (isTabRoute(route)) {
      setTab(route.screen);
      setOverlay(null);
    } else {
      setOverlay(route);
    }
  }, []);

  const back = useCallback(() => setOverlay(null), []);

  return (
    <NavigationContext.Provider value={{ tab, overlay, navigate, back }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation(): NavigationContextValue {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return ctx;
}

function isTabRoute(route: Route): route is { screen: MainTabId } {
  return (mainTabIds as readonly string[]).includes(route.screen);
}
