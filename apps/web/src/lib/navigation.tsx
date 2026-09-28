import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { pathForRoute, routeFromPath } from './routes.js';
import type { SubjectModeId } from '../data/subjectContent.js';

/**
 * The persistent tabs behind the bottom nav (mobile) / sidebar
 * (desktop) — S1 Block 6, approved design. The screenshots show a
 * couple of different labels for slot 2/4 across mocks (Учёба vs
 * Тренировка, Достижения vs Ошибки vs Рейтинг); a real nav needs one
 * fixed set, so this uses the pattern that recurs across the most
 * screens. Мои ошибки / Рейтинг / О проекте stay reachable from Home
 * and the Menu overlay rather than living in the tab bar itself.
 * Профиль is an overlay (see `OverlayRoute`), not a tab — it opens
 * from Menu on top of whichever tab is underneath, the same as every
 * other Menu destination, so BackRow returns there correctly instead
 * of always landing on Home.
 */
export type MainTabId = 'home' | 'training' | 'statistics' | 'achievements';

export const mainTabIds: readonly MainTabId[] = ['home', 'training', 'statistics', 'achievements'];

/**
 * Full-screen overlays reached from a tab. Task/Result hide the tab
 * chrome entirely (mobile bottom nav / desktop sidebar) so the task
 * gets full screen real estate, matching the approved screenshots.
 */
export type OverlayRoute =
  | { screen: 'onboarding' }
  | { screen: 'learningCenter' }
  | { screen: 'subjectCatalog' }
  | {
      screen: 'subject';
      subjectId: string;
      /** Which screen opened this subject page, so BackRow can return
       * there directly (e.g. "Предметы → Математика → назад →
       * Предметы") instead of falling back to the underlying tab —
       * this router has no general back-stack, so the one drill-down
       * that needs it carries its own parent explicitly. */
      from?: 'subjectCatalog' | 'learningCenter';
      /** The collection slug selected in the "Источник" picker (e.g.
       * "ege-2026-yashchenko"), or absent for "Общий банк" (no
       * filter). Carried here — not component-local state — so it
       * survives navigating away to a task and back: this is the same
       * pattern subjectId/taskNumber/taskId already use to cross a
       * screen unmount, never a value a component would lose. */
      collectionSlug?: string;
      /** Opens the Subject page straight into this mode (e.g. `'byNumber'`
       * when returning from Result's "К списку заданий") instead of the
       * default "Темы" tab — absent means "let the page pick its own
       * default", same as before this existed. */
      initialMode?: SubjectModeId;
    }
  | {
      screen: 'task';
      subjectId: string;
      taskNumber: number;
      taskId: string;
      collectionSlug?: string;
      /** A specific variant's id, when already known (e.g. picked
       * explicitly in Training's "Вариант" mode) — lets the task
       * navigation hook skip re-resolving it from collectionSlug+taskId
       * on every screen. Absent just means "resolve it lazily"; it is
       * NOT required for source/variant isolation, which collectionSlug
       * alone already provides. */
      variantId?: string;
    }
  | {
      screen: 'result';
      subjectId: string;
      taskNumber: number;
      taskId: string;
      correct: boolean;
      /** The user's actual submitted answer — Result must show what
       * they really typed, never a placeholder. */
      userAnswer: string;
      collectionSlug?: string;
      variantId?: string;
    }
  | { screen: 'mistakes' }
  /** Addressable placeholders for training modes not yet built as
   * their own screens — routing needs a real page for each one so
   * refresh/direct-link/Back-Forward work, even though the mode
   * itself still renders the plain WIP placeholder. */
  | { screen: 'trainingTopic' }
  | { screen: 'trainingRandom' }
  | { screen: 'trainingVariants' }
  | { screen: 'rating' }
  | { screen: 'about' }
  | { screen: 'menu' }
  | { screen: 'favorites' }
  | { screen: 'mockExams' }
  | { screen: 'topics' }
  | { screen: 'friends' }
  | { screen: 'friendProfile'; friendId: string }
  | { screen: 'settings' }
  | { screen: 'help' }
  | { screen: 'notifications' }
  | {
      screen: 'profile';
      /** The full previous route (tab or overlay), so BackRow can
       * restore it exactly — Menu replaces whatever overlay was
       * showing when it opens Профиль (this router has no general
       * back-stack), so without this the "previous screen" is gone
       * before BackRow ever runs. */
      from?: Route;
    };

export type Route = { screen: MainTabId } | OverlayRoute;

const routeLabels: Partial<Record<Route['screen'], string>> = {
  home: 'Главная',
  training: 'Тренировка',
  statistics: 'Статистика',
  achievements: 'Достижения',
  learningCenter: 'Учебный центр',
  subjectCatalog: 'Предметы',
  mistakes: 'Мои ошибки',
  rating: 'Рейтинг',
  about: 'О проекте',
};

/** A human label for any route, used by BackRow to name where it's
 * going back to. Falls back to "Главная" for routes with no fixed
 * name (task/result/subject carry their own context instead). */
export function getRouteLabel(route: Route): string {
  return routeLabels[route.screen] ?? 'Главная';
}

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

function initialRoute(): Route {
  return typeof window === 'undefined'
    ? { screen: 'home' }
    : routeFromPath(window.location.pathname + window.location.search);
}

/**
 * Lightweight typed navigation: a router this small doesn't need a
 * routing library. Tabs are mutually exclusive and drive the nav's
 * active state; everything else is an overlay on top of whichever tab
 * is underneath, dismissed by `back()`. The URL is the source of truth
 * (see `lib/routes.ts`): `navigate()` pushes a history entry for every
 * addressable route, a `popstate` listener re-syncs `tab`/`overlay`
 * when the user hits Back/Forward or the page is restored from
 * history, and the initial state is parsed from `window.location` so
 * a refresh or a direct link lands on the right screen instead of
 * always resetting to Home.
 */
export function NavigationProvider({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<MainTabId>(() => {
    const route = initialRoute();
    return isTabRoute(route) ? route.screen : 'home';
  });
  const [overlay, setOverlay] = useState<OverlayRoute | null>(() => {
    const route = initialRoute();
    return isTabRoute(route) ? null : route;
  });

  useEffect(() => {
    function onPopState() {
      const route = routeFromPath(window.location.pathname + window.location.search);
      if (isTabRoute(route)) {
        setTab(route.screen);
        setOverlay(null);
      } else {
        setOverlay(route);
      }
    }
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((route: Route) => {
    if (isTabRoute(route)) {
      setTab(route.screen);
      setOverlay(null);
    } else {
      setOverlay(route);
    }
    const path = pathForRoute(route);
    const currentPath = window.location.pathname + window.location.search;
    if (path !== null && path !== currentPath) {
      window.history.pushState(null, '', path);
    }
  }, []);

  // Only routes `navigate()` actually pushed a history entry for can
  // be popped — `menu`/`task`/`result` have no URL (see routes.ts), so
  // closing them just clears the overlay in place, same as before URL
  // routing existed.
  const back = useCallback(() => {
    if (overlay && pathForRoute(overlay) !== null) {
      window.history.back();
    } else {
      setOverlay(null);
    }
  }, [overlay]);

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
