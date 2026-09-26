import type { MainTabId, OverlayRoute, Route } from './navigation.js';

/**
 * URL <-> Route mapping. The URL is the single source of truth for
 * which screen is showing (Section 5 of the routing rework) — every
 * addressable route below round-trips through here so refresh, direct
 * links, and Back/Forward all resolve to the same screen `navigate()`
 * would have produced.
 *
 * Not every `Route` is addressable: `menu` is a transient drawer (no
 * approved screenshot treats it as its own page — see DesktopMenu/
 * MobileMenu), and `task`/`result` need a real `taskId` this demo data
 * model can't restore from a bare URL, so those three keep the
 * pre-routing behavior (no history entry, no path) rather than
 * pretending to deep-link into content that doesn't exist yet.
 */

const subjectSlugs: Record<string, string> = {
  math: 'math',
  russian: 'russian',
  english: 'english',
  social: 'social-studies',
  informatics: 'informatics',
  physics: 'physics',
  chemistry: 'chemistry',
  biology: 'biology',
  history: 'history',
};

const slugToSubjectId: Record<string, string> = Object.fromEntries(
  Object.entries(subjectSlugs).map(([id, slug]) => [slug, id]),
);

/** Overlay screens with no params — a straight path <-> screen lookup. */
const simpleOverlayPaths: Partial<Record<OverlayRoute['screen'], string>> = {
  learningCenter: '/learning',
  subjectCatalog: '/subjects',
  mistakes: '/training/mistakes',
  trainingTopic: '/training/topic',
  trainingRandom: '/training/random',
  trainingVariants: '/training/variants',
  rating: '/rating',
  about: '/about',
  favorites: '/favorites',
  mockExams: '/mock-exams',
  topics: '/topics',
  friends: '/friends',
  settings: '/settings',
  help: '/help',
  notifications: '/notifications',
  onboarding: '/onboarding',
};

const tabPaths: Record<string, string> = {
  home: '/',
  training: '/training',
  statistics: '/statistics',
  achievements: '/achievements',
};

/** Routes that never get a URL/history entry (see file header). */
function isUnaddressable(route: Route): boolean {
  return route.screen === 'menu' || route.screen === 'task' || route.screen === 'result';
}

export function pathForRoute(route: Route): string | null {
  if (isUnaddressable(route)) return null;

  if (route.screen in tabPaths) {
    return tabPaths[route.screen]!;
  }

  if (route.screen === 'subject') {
    const slug = subjectSlugs[route.subjectId] ?? route.subjectId;
    return `/subjects/${slug}`;
  }

  if (route.screen === 'profile') {
    return '/profile';
  }

  const simple = simpleOverlayPaths[route.screen as OverlayRoute['screen']];
  return simple ?? null;
}

const simpleOverlayScreens = new Set(Object.keys(simpleOverlayPaths));

/** Parses a pathname into a Route, defaulting to Home for anything
 * unrecognized rather than erroring — a stale/typo'd/removed link
 * should land the user somewhere real, not a blank screen. */
export function routeFromPath(pathname: string): Route {
  const path = pathname.replace(/\/+$/, '') || '/';

  if (path === '/') return { screen: 'home' };

  for (const [tab, tabPath] of Object.entries(tabPaths)) {
    if (tab !== 'home' && path === tabPath) return { screen: tab as MainTabId };
  }

  const subjectMatch = path.match(/^\/subjects\/([a-z-]+)$/);
  if (subjectMatch) {
    const slug = subjectMatch[1]!;
    const subjectId = slugToSubjectId[slug] ?? slug;
    return { screen: 'subject', subjectId, from: 'subjectCatalog' };
  }

  if (path === '/profile') return { screen: 'profile' };

  for (const [screen, screenPath] of Object.entries(simpleOverlayPaths)) {
    if (path === screenPath) return { screen } as OverlayRoute;
  }

  return { screen: 'home' };
}

export function isAddressableScreen(screen: string): boolean {
  return (
    screen in tabPaths ||
    screen === 'subject' ||
    screen === 'profile' ||
    simpleOverlayScreens.has(screen)
  );
}
