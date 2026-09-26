import { describe, expect, it } from 'vitest';
import { getStreakTier, getLevelTier, getStreakAsset, getLevelAsset } from './rank.js';

describe('getStreakTier', () => {
  it('boundary values', () => {
    expect(getStreakTier(0)).toBe('gray');
    expect(getStreakTier(1)).toBe('red-1-9');
    expect(getStreakTier(9)).toBe('red-1-9');
    expect(getStreakTier(10)).toBe('red-10-29');
    expect(getStreakTier(29)).toBe('red-10-29');
    expect(getStreakTier(30)).toBe('purple-30-plus');
    expect(getStreakTier(87)).toBe('purple-30-plus');
  });
});

describe('getLevelTier', () => {
  it('boundary values', () => {
    expect(getLevelTier(1)).toBe('gold');
    expect(getLevelTier(5)).toBe('gold');
    expect(getLevelTier(6)).toBe('red');
    expect(getLevelTier(10)).toBe('red');
    expect(getLevelTier(11)).toBe('pink');
    expect(getLevelTier(25)).toBe('pink');
  });
});

describe('asset paths', () => {
  it('resolve to the real PNGs, one per tier', () => {
    expect(getStreakAsset(0)).toBe('/branding/v2/rank/streak-gray.png');
    expect(getStreakAsset(5)).toBe('/branding/v2/rank/streak-red-1-9.png');
    expect(getStreakAsset(15)).toBe('/branding/v2/rank/streak-red-10-29.png');
    expect(getStreakAsset(40)).toBe('/branding/v2/rank/streak-purple-30-plus.png');

    expect(getLevelAsset(3)).toBe('/branding/v2/rank/level-gold.png');
    expect(getLevelAsset(8)).toBe('/branding/v2/rank/level-red.png');
    expect(getLevelAsset(23)).toBe('/branding/v2/rank/level-pink.png');
  });
});
