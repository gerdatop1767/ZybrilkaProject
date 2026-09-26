import { describe, expect, it } from 'vitest';
import { pathForRoute, routeFromPath } from './routes.js';
import type { Route } from './navigation.js';

describe('pathForRoute', () => {
  it('maps tabs to their paths', () => {
    expect(pathForRoute({ screen: 'home' })).toBe('/');
    expect(pathForRoute({ screen: 'training' })).toBe('/training');
    expect(pathForRoute({ screen: 'statistics' })).toBe('/statistics');
    expect(pathForRoute({ screen: 'achievements' })).toBe('/achievements');
  });

  it('maps subjects to slugged paths, including the social-studies exception', () => {
    expect(pathForRoute({ screen: 'subject', subjectId: 'math' })).toBe('/subjects/math');
    expect(pathForRoute({ screen: 'subject', subjectId: 'social' })).toBe(
      '/subjects/social-studies',
    );
  });

  it('maps simple overlays to their paths', () => {
    expect(pathForRoute({ screen: 'subjectCatalog' })).toBe('/subjects');
    expect(pathForRoute({ screen: 'profile' })).toBe('/profile');
    expect(pathForRoute({ screen: 'help' })).toBe('/help');
    expect(pathForRoute({ screen: 'rating' })).toBe('/rating');
    expect(pathForRoute({ screen: 'about' })).toBe('/about');
    expect(pathForRoute({ screen: 'mistakes' })).toBe('/training/mistakes');
  });

  it('returns null for routes with no URL (menu/task/result)', () => {
    expect(pathForRoute({ screen: 'menu' })).toBeNull();
    expect(
      pathForRoute({ screen: 'task', subjectId: 'math', taskNumber: 1, taskId: 't1' }),
    ).toBeNull();
    expect(
      pathForRoute({
        screen: 'result',
        subjectId: 'math',
        taskNumber: 1,
        taskId: 't1',
        correct: true,
        userAnswer: '1',
      }),
    ).toBeNull();
  });
});

describe('routeFromPath', () => {
  it('round-trips every addressable route through pathForRoute', () => {
    const routes: Route[] = [
      { screen: 'home' },
      { screen: 'training' },
      { screen: 'statistics' },
      { screen: 'achievements' },
      { screen: 'subjectCatalog' },
      { screen: 'subject', subjectId: 'math' },
      { screen: 'subject', subjectId: 'social' },
      { screen: 'mistakes' },
      { screen: 'rating' },
      { screen: 'about' },
      { screen: 'profile' },
      { screen: 'help' },
    ];
    for (const route of routes) {
      const path = pathForRoute(route);
      expect(path).not.toBeNull();
      expect(routeFromPath(path!)).toEqual(
        route.screen === 'subject' ? { ...route, from: 'subjectCatalog' } : route,
      );
    }
  });

  it('falls back to Home for an unknown path', () => {
    expect(routeFromPath('/this-does-not-exist')).toEqual({ screen: 'home' });
  });

  it('ignores a trailing slash', () => {
    expect(routeFromPath('/help/')).toEqual({ screen: 'help' });
  });
});
