/**
 * Pure, framework-agnostic scratchboard state (Task Workspace block 4
 * — "Полотно"/"Расширить поле", CLAUDE.md Section 13). A stroke is
 * just the points a pointer visited plus the tool/color/size active
 * when it was drawn — rendering (canvas 2D context, pointer events)
 * lives in the UI component; this file only owns "what strokes exist"
 * and undo/redo/clear over them, so that logic is testable without a
 * DOM canvas at all.
 */

export interface CanvasPoint {
  x: number;
  y: number;
}

export type CanvasTool = 'brush' | 'eraser';

export interface CanvasStroke {
  points: readonly CanvasPoint[];
  tool: CanvasTool;
  /** Ignored for 'eraser' strokes (rendered via destination-out
   * compositing instead), kept here anyway so a stroke is a complete,
   * self-describing record of what was drawn. */
  color: string;
  size: number;
}

export interface CanvasState {
  strokes: readonly CanvasStroke[];
  /** Strokes undo has popped off `strokes` — cleared the moment a new
   * stroke is committed, same as any standard undo/redo stack (redoing
   * after drawing something new would silently resurrect a stroke the
   * user has since drawn over otherwise). */
  redoStack: readonly CanvasStroke[];
}

export function initialCanvasState(): CanvasState {
  return { strokes: [], redoStack: [] };
}

export function commitStroke(state: CanvasState, stroke: CanvasStroke): CanvasState {
  if (stroke.points.length === 0) return state;
  return { strokes: [...state.strokes, stroke], redoStack: [] };
}

export function undoStroke(state: CanvasState): CanvasState {
  if (state.strokes.length === 0) return state;
  const last = state.strokes[state.strokes.length - 1]!;
  return { strokes: state.strokes.slice(0, -1), redoStack: [...state.redoStack, last] };
}

export function redoStroke(state: CanvasState): CanvasState {
  if (state.redoStack.length === 0) return state;
  const restored = state.redoStack[state.redoStack.length - 1]!;
  return { strokes: [...state.strokes, restored], redoStack: state.redoStack.slice(0, -1) };
}

export function clearCanvas(): CanvasState {
  return initialCanvasState();
}
