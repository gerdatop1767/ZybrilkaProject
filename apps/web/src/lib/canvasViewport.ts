export interface CanvasViewport {
  zoom: number;
  panX: number;
  panY: number;
}

export interface ScreenPoint {
  x: number;
  y: number;
}

// QA v2 Block C: the old range (MIN 1, initial zoom 1) meant the canvas
// opened already at its own zoom-out floor — the user had no room to
// zoom out further at all. MIN_ZOOM is now below the starting zoom so
// there's real headroom in both directions; MAX_ZOOM stays modest
// (there's no legitimate reason to zoom in past 4x on a handwriting
// surface, and a huge ceiling only invites the backing-store-resize
// cost that caused the reported lag).
export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 4;

export function initialViewport(): CanvasViewport {
  return { zoom: 1, panX: 0, panY: 0 };
}

export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

/**
 * Converts a point in viewport-local screen coordinates (client
 * coordinates minus the viewport's own bounding-rect origin) into
 * world coordinates — the fixed coordinate space strokes are stored
 * in, independent of the current zoom/pan. This is the single
 * conversion every pointer handler must go through before touching
 * stroke data, so a stroke drawn at any zoom/pan always lands on the
 * same "page" location.
 */
export function screenToWorld(viewport: CanvasViewport, screenPoint: ScreenPoint): ScreenPoint {
  return {
    x: (screenPoint.x - viewport.panX) / viewport.zoom,
    y: (screenPoint.y - viewport.panY) / viewport.zoom,
  };
}

/**
 * Zooms by `factor` while keeping the world point currently under
 * `screenAnchor` fixed on screen — the standard pinch-to-zoom /
 * ctrl+wheel-zoom anchor behavior, so the content under the user's
 * fingers/cursor doesn't jump.
 */
export function zoomAtPoint(
  viewport: CanvasViewport,
  screenAnchor: ScreenPoint,
  factor: number,
): CanvasViewport {
  const nextZoom = clampZoom(viewport.zoom * factor);
  if (nextZoom === viewport.zoom) return viewport;
  const worldAnchor = screenToWorld(viewport, screenAnchor);
  return {
    zoom: nextZoom,
    panX: screenAnchor.x - worldAnchor.x * nextZoom,
    panY: screenAnchor.y - worldAnchor.y * nextZoom,
  };
}

export function panBy(viewport: CanvasViewport, dx: number, dy: number): CanvasViewport {
  return { ...viewport, panX: viewport.panX + dx, panY: viewport.panY + dy };
}

export function distanceBetween(a: ScreenPoint, b: ScreenPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function midpointBetween(a: ScreenPoint, b: ScreenPoint): ScreenPoint {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
