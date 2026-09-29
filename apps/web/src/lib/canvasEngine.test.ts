import { describe, expect, it } from 'vitest';
import {
  clearCanvas,
  commitStroke,
  initialCanvasState,
  redoStroke,
  undoStroke,
  type CanvasStroke,
} from './canvasEngine.js';

function stroke(overrides: Partial<CanvasStroke> = {}): CanvasStroke {
  return {
    points: [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
    ],
    tool: 'brush',
    color: '#ffffff',
    size: 4,
    ...overrides,
  };
}

describe('canvasEngine (Task Workspace block 4 — session-scoped canvas)', () => {
  it('starts empty', () => {
    expect(initialCanvasState()).toEqual({ strokes: [], redoStack: [] });
  });

  it('commitStroke appends a stroke and clears any redo stack', () => {
    const s1 = commitStroke(initialCanvasState(), stroke());
    expect(s1.strokes).toHaveLength(1);
    const afterUndo = undoStroke(s1);
    expect(afterUndo.redoStack).toHaveLength(1);
    const s2 = commitStroke(afterUndo, stroke({ color: '#ff0000' }));
    expect(s2.strokes).toHaveLength(1);
    expect(s2.redoStack).toHaveLength(0);
  });

  it('commitStroke ignores an empty stroke (no points) — no accidental dot from a tap-and-release with no movement', () => {
    const state = commitStroke(initialCanvasState(), stroke({ points: [] }));
    expect(state.strokes).toHaveLength(0);
  });

  it('undo removes the most recent stroke and moves it to the redo stack', () => {
    const s1 = commitStroke(initialCanvasState(), stroke({ color: 'a' }));
    const s2 = commitStroke(s1, stroke({ color: 'b' }));
    const undone = undoStroke(s2);
    expect(undone.strokes.map((s) => s.color)).toEqual(['a']);
    expect(undone.redoStack.map((s) => s.color)).toEqual(['b']);
  });

  it('undo on an empty canvas is a no-op', () => {
    expect(undoStroke(initialCanvasState())).toEqual(initialCanvasState());
  });

  it('redo restores the most recently undone stroke', () => {
    const s1 = commitStroke(initialCanvasState(), stroke({ color: 'a' }));
    const undone = undoStroke(s1);
    const redone = redoStroke(undone);
    expect(redone.strokes.map((s) => s.color)).toEqual(['a']);
    expect(redone.redoStack).toHaveLength(0);
  });

  it('redo on a state with nothing undone is a no-op', () => {
    const s1 = commitStroke(initialCanvasState(), stroke());
    expect(redoStroke(s1)).toEqual(s1);
  });

  it('multiple undo/redo round-trips restore strokes in the right order', () => {
    let state = initialCanvasState();
    state = commitStroke(state, stroke({ color: '1' }));
    state = commitStroke(state, stroke({ color: '2' }));
    state = commitStroke(state, stroke({ color: '3' }));
    state = undoStroke(state);
    state = undoStroke(state);
    expect(state.strokes.map((s) => s.color)).toEqual(['1']);
    state = redoStroke(state);
    expect(state.strokes.map((s) => s.color)).toEqual(['1', '2']);
  });

  it('clearCanvas resets to the initial empty state, dropping the redo stack too', () => {
    expect(clearCanvas()).toEqual(initialCanvasState());
  });
});
