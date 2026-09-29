import { describe, expect, it } from 'vitest';
import {
  clampZoom,
  distanceBetween,
  initialViewport,
  midpointBetween,
  panBy,
  screenToWorld,
  zoomAtPoint,
  MAX_ZOOM,
  MIN_ZOOM,
} from './canvasViewport.js';

describe('canvasViewport (Canvas zoom/pan — coordinate math)', () => {
  it('starts at zoom 1, no pan', () => {
    expect(initialViewport()).toEqual({ zoom: 1, panX: 0, panY: 0 });
  });

  it('clampZoom keeps values within [MIN_ZOOM, MAX_ZOOM]', () => {
    expect(clampZoom(0.1)).toBe(MIN_ZOOM);
    expect(clampZoom(100)).toBe(MAX_ZOOM);
    expect(clampZoom(2)).toBe(2);
  });

  it('screenToWorld inverts panX/panY and zoom', () => {
    const viewport = { zoom: 2, panX: 10, panY: 20 };
    expect(screenToWorld(viewport, { x: 10, y: 20 })).toEqual({ x: 0, y: 0 });
    expect(screenToWorld(viewport, { x: 110, y: 220 })).toEqual({ x: 50, y: 100 });
  });

  it('zoomAtPoint keeps the world point under the anchor fixed on screen', () => {
    const viewport = { zoom: 1, panX: 0, panY: 0 };
    const anchor = { x: 100, y: 150 };
    const worldUnderAnchorBefore = screenToWorld(viewport, anchor);
    const zoomed = zoomAtPoint(viewport, anchor, 2);
    const worldUnderAnchorAfter = screenToWorld(zoomed, anchor);
    expect(worldUnderAnchorAfter.x).toBeCloseTo(worldUnderAnchorBefore.x);
    expect(worldUnderAnchorAfter.y).toBeCloseTo(worldUnderAnchorBefore.y);
    expect(zoomed.zoom).toBe(2);
  });

  it('zoomAtPoint is a no-op once already clamped at MAX_ZOOM', () => {
    const viewport = { zoom: MAX_ZOOM, panX: 5, panY: 5 };
    const zoomed = zoomAtPoint(viewport, { x: 0, y: 0 }, 10);
    expect(zoomed).toBe(viewport);
  });

  it('zoomAtPoint is a no-op once already clamped at MIN_ZOOM zooming out further', () => {
    const viewport = { zoom: MIN_ZOOM, panX: 5, panY: 5 };
    const zoomed = zoomAtPoint(viewport, { x: 0, y: 0 }, 0.1);
    expect(zoomed).toBe(viewport);
  });

  it('panBy adds screen-space deltas to panX/panY without touching zoom', () => {
    const viewport = { zoom: 1.5, panX: 10, panY: 20 };
    expect(panBy(viewport, 5, -5)).toEqual({ zoom: 1.5, panX: 15, panY: 15 });
  });

  it('distanceBetween / midpointBetween compute plain 2D geometry', () => {
    expect(distanceBetween({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    expect(midpointBetween({ x: 0, y: 0 }, { x: 10, y: 20 })).toEqual({ x: 5, y: 10 });
  });
});
