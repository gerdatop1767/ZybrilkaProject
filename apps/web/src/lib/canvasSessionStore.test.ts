import { beforeEach, describe, expect, it } from 'vitest';
import { commitStroke, initialCanvasState, type CanvasStroke } from './canvasEngine.js';
import {
  clearCanvasState,
  getCanvasState,
  resetCanvasStoreForTests,
  setCanvasState,
} from './canvasSessionStore.js';

const STROKE: CanvasStroke = {
  points: [
    { x: 0, y: 0 },
    { x: 5, y: 5 },
  ],
  tool: 'brush',
  color: '#fff',
  size: 4,
};

beforeEach(() => {
  resetCanvasStoreForTests();
});

describe('canvasSessionStore (Task Workspace block 4)', () => {
  it('a task with nothing drawn yet returns the empty initial state', () => {
    expect(getCanvasState('task-a')).toEqual(initialCanvasState());
  });

  it('a drawing survives "closing and reopening" — read after write for the same task', () => {
    const drawn = commitStroke(initialCanvasState(), STROKE);
    setCanvasState('task-a', drawn);
    expect(getCanvasState('task-a')).toEqual(drawn);
  });

  it("switching to a different task never sees the first task's drawing", () => {
    const drawn = commitStroke(initialCanvasState(), STROKE);
    setCanvasState('task-a', drawn);
    expect(getCanvasState('task-b')).toEqual(initialCanvasState());
  });

  it('task A drawing → open task B (empty) → back to task A restores it', () => {
    const drawn = commitStroke(initialCanvasState(), STROKE);
    setCanvasState('task-a', drawn);
    expect(getCanvasState('task-b')).toEqual(initialCanvasState());
    expect(getCanvasState('task-a')).toEqual(drawn);
  });

  it('clearCanvasState (a new attempt/new task session) empties a task back to initial', () => {
    setCanvasState('task-a', commitStroke(initialCanvasState(), STROKE));
    clearCanvasState('task-a');
    expect(getCanvasState('task-a')).toEqual(initialCanvasState());
  });

  it('clearing one task never touches another', () => {
    setCanvasState('task-a', commitStroke(initialCanvasState(), STROKE));
    setCanvasState('task-b', commitStroke(initialCanvasState(), STROKE));
    clearCanvasState('task-a');
    expect(getCanvasState('task-a')).toEqual(initialCanvasState());
    expect(getCanvasState('task-b').strokes).toHaveLength(1);
  });
});
