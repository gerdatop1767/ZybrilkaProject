import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

/**
 * The persistent tabs behind the bottom navigation. `battles` is one of
 * BottomNav's existing 5 default items (Block 1/2) — it renders here as
 * a "coming soon" placeholder, since real battles logic is out of this
 * block's scope, rather than leaving the button dead or duplicating
 * BottomNav's item list to hide it.
 */
export type MainTabId = 'home' | 'training' | 'battles' | 'progress' | 'profile';

export const mainTabIds: readonly MainTabId[] = [
  'home',
  'training',
  'battles',
  'progress',
  'profile',
];

/**
 * Full-screen overlays reached from a tab: Task/Result (from Home or
 * Training) and Onboarding (from Profile). They hide the bottom nav —
 * that's the screen's own concern via `overlay !== null` below, not
 * duplicated per screen.
 */
export type OverlayRoute =
  | { screen: 'onboarding' }
  | { screen: 'task'; taskId: string }
  | { screen: 'result'; taskId: string; correct: boolean };

export type Route = { screen: MainTabId } | OverlayRoute;

interface NavigationContextValue {
  /** The currently selected bottom-nav tab (persists under an open overlay). */
  tab: MainTabId;
  /** The active overlay, or null when a tab screen is showing. */
  overlay: OverlayRoute | null;
  navigate: (route: Route) => void;
  /** Closes the current overlay, returning to its underlying tab. */
  back: () => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

/**
 * Lightweight typed navigation (Design Spec Section 3 / 9): a router
 * this small doesn't need a routing library. Tabs (Home/Training/
 * Progress/Profile) are mutually exclusive and drive BottomNav's
 * active state; Task/Result/Onboarding are overlays on top of whichever
 * tab is underneath, dismissed by `back()`.
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
