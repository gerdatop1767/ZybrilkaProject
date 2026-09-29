import { useCallback, useEffect, useRef, useState } from 'react';
import {
  clearCanvas,
  commitStroke,
  redoStroke,
  undoStroke,
  type CanvasPoint,
  type CanvasState,
  type CanvasStroke,
  type CanvasTool,
} from '../../lib/canvasEngine.js';
import {
  distanceBetween,
  initialViewport,
  midpointBetween,
  panBy,
  screenToWorld,
  zoomAtPoint,
  type CanvasViewport,
} from '../../lib/canvasViewport.js';
import type { SampleTask } from '../../data/sampleTask.js';
import { Icon } from '../Icon/Icon.js';
import { MathText } from '../MathText/MathText.js';
import {
  TaskExamIllustration,
  TaskSolutionIllustration,
} from '../TaskIllustration/TaskIllustration.js';
import { clsx } from '../../lib/clsx.js';
import styles from './CanvasBoard.module.css';

/** Mirrors the design tokens' accent/status colors (tokens.css) —
 * canvas 2D fillStyle/strokeStyle needs literal color strings, not CSS
 * custom properties, so these are the same hex values by hand rather
 * than a new palette. The white swatch is dropped here (block —
 * "canvas mobile fix"): the drawing surface is now white paper, so
 * white ink would be invisible; a near-black replaces it as the
 * default "pen" color. */
const PALETTE = ['#14141f', '#8b14f5', '#0a84ff', '#16a34a', '#e11d48', '#d97706'] as const;

const SIZES = [3, 6, 10] as const;

/** Extra blank drawing room below the task card, in world px — a
 * generous scratch area (more than one screenful) so the "свободная
 * область полотна" always has real room, not just whatever's left
 * over after the task card. */
const MIN_FREE_SPACE = 700;

export interface CanvasBoardProps {
  state: CanvasState;
  onChangeState: (next: CanvasState) => void;
  task: SampleTask;
}

/**
 * The scratchboard's shared drawing core (Task Workspace — "canvas
 * mobile fix" block): a single white, zoomable/pannable "world" that
 * contains BOTH the current task's condition/illustration (top) and
 * the free-draw canvas layered directly over the whole world, so the
 * user can draw over the task or below it as one continuous surface —
 * not a separate static reference panel bolted on top of a small
 * canvas. Identical between the mobile near-fullscreen workspace and
 * the desktop large modal; only their surrounding chrome (header,
 * overlay shape) differs.
 *
 * Coordinate model: strokes are stored in WORLD coordinates (the
 * canvasEngine/canvasSessionStore data never knows about zoom/pan).
 * `viewport` (zoom/panX/panY, canvasViewport.ts) converts between
 * screen space and world space; the canvas' own backing-store
 * resolution is resized to `zoom * devicePixelRatio` on every zoom
 * change so strokes stay crisp at any zoom instead of a blurry
 * CSS-stretched bitmap. The task card is real HTML/SVG (MathText +
 * TaskIllustration) inside the same pannable world, scaled with a
 * genuine CSS `transform: scale()` (crisp for text/vector content,
 * unlike a rasterized canvas) — one shared `translate` on the world
 * wrapper handles pan, and each layer handles its own zoom scaling in
 * whichever way keeps it crisp.
 */
function paintStroke(ctx: CanvasRenderingContext2D, stroke: CanvasStroke) {
  if (stroke.points.length === 0) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = stroke.size;
  if (stroke.tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
  } else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = stroke.color;
  }
  ctx.beginPath();
  const [first, ...rest] = stroke.points;
  ctx.moveTo(first!.x, first!.y);
  if (rest.length === 0) {
    // A tap with no movement still shows as a dot, not nothing.
    ctx.lineTo(first!.x + 0.01, first!.y + 0.01);
  }
  for (const point of rest) ctx.lineTo(point.x, point.y);
  ctx.stroke();
  ctx.restore();
}

export function CanvasBoard({ state, onChangeState, task }: CanvasBoardProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const taskCardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<CanvasTool>('brush');
  const [color, setColor] = useState<string>(PALETTE[0]);
  const [size, setSize] = useState<number>(SIZES[1]);
  const [rulerMode, setRulerMode] = useState(false);
  const [activePoints, setActivePoints] = useState<CanvasPoint[] | null>(null);
  const [viewport, setViewport] = useState<CanvasViewport>(initialViewport);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [taskCardHeight, setTaskCardHeight] = useState(0);

  // Active pointers currently down on the canvas, keyed by pointerId —
  // 1 pointer draws, 2 pan/zoom (a real pinch), 3+ are ignored. Refs,
  // not state: every pointermove needs the latest set synchronously,
  // and none of this should trigger its own re-render.
  const activePointers = useRef(new Map<number, CanvasPoint>());
  const drawingPointerId = useRef<number | null>(null);
  const gestureRef = useRef<{ distance: number; midpoint: CanvasPoint } | null>(null);

  const worldWidth = viewportSize.width;
  const worldHeight = taskCardHeight + Math.max(MIN_FREE_SPACE, viewportSize.height);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || worldWidth === 0) return;
    ctx.clearRect(0, 0, worldWidth, worldHeight);
    for (const stroke of state.strokes) paintStroke(ctx, stroke);
    if (activePoints && activePoints.length > 0) {
      paintStroke(ctx, { points: activePoints, tool, color, size });
    }
  }, [state.strokes, activePoints, tool, color, size, worldWidth, worldHeight]);

  // Tracks the viewport's own box size (independent of zoom — a CSS
  // transform never changes an ancestor's layout size) so `worldWidth`
  // always matches the panel's real available width.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setViewportSize({ width: el.clientWidth, height: el.clientHeight });
    });
    observer.observe(el);
    setViewportSize({ width: el.clientWidth, height: el.clientHeight });
    return () => observer.disconnect();
  }, []);

  // Tracks the task card's natural (zoom-1) height — KaTeX/illustration
  // content can change size after their own async layout — so the
  // free-draw area below always starts right after the real card, not
  // a guessed height.
  useEffect(() => {
    const el = taskCardRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setTaskCardHeight(el.offsetHeight));
    observer.observe(el);
    setTaskCardHeight(el.offsetHeight);
    return () => observer.disconnect();
  }, [task.id]);

  // Resizes the canvas backing store to `zoom * devicePixelRatio`
  // whenever the world size or zoom changes, then repaints — this is
  // what keeps ink crisp at any zoom level instead of a blurry
  // CSS-scaled bitmap (the whole point of storing strokes in world
  // coordinates rather than screen pixels).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || worldWidth === 0) return;
    const dpr = window.devicePixelRatio || 1;
    const scale = viewport.zoom * dpr;
    canvas.width = Math.max(1, Math.round(worldWidth * scale));
    canvas.height = Math.max(1, Math.round(worldHeight * scale));
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.setTransform(scale, 0, 0, scale, 0, 0);
    draw();
  }, [worldWidth, worldHeight, viewport.zoom, draw]);

  useEffect(() => {
    draw();
  }, [draw]);

  function getViewportPoint(event: { clientX: number; clientY: number }): CanvasPoint {
    const rect = viewportRef.current!.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function endStroke() {
    if (activePoints && activePoints.length > 0) {
      onChangeState(commitStroke(state, { points: activePoints, tool, color, size }));
    }
    setActivePoints(null);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    const screenPoint = getViewportPoint(event);
    activePointers.current.set(event.pointerId, screenPoint);

    if (activePointers.current.size === 2) {
      // A 2nd finger just landed — this is now a pinch/pan gesture, not
      // a stroke. Drop any in-progress single-finger mark rather than
      // committing a stray line from the instant before the pinch
      // started.
      drawingPointerId.current = null;
      setActivePoints(null);
      const points = [...activePointers.current.values()];
      gestureRef.current = {
        distance: distanceBetween(points[0]!, points[1]!),
        midpoint: midpointBetween(points[0]!, points[1]!),
      };
    } else if (activePointers.current.size === 1) {
      drawingPointerId.current = event.pointerId;
      setActivePoints([screenToWorld(viewport, screenPoint)]);
    }
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!activePointers.current.has(event.pointerId)) return;
    const screenPoint = getViewportPoint(event);
    activePointers.current.set(event.pointerId, screenPoint);

    if (activePointers.current.size >= 2) {
      const points = [...activePointers.current.values()].slice(0, 2);
      const newDistance = distanceBetween(points[0]!, points[1]!);
      const newMidpoint = midpointBetween(points[0]!, points[1]!);
      const gesture = gestureRef.current;
      if (gesture && gesture.distance > 0) {
        const factor = newDistance / gesture.distance;
        setViewport((current) => {
          const zoomed = zoomAtPoint(current, gesture.midpoint, factor);
          return panBy(
            zoomed,
            newMidpoint.x - gesture.midpoint.x,
            newMidpoint.y - gesture.midpoint.y,
          );
        });
      }
      gestureRef.current = { distance: newDistance, midpoint: newMidpoint };
      return;
    }

    if (drawingPointerId.current === event.pointerId) {
      const worldPoint = screenToWorld(viewport, screenPoint);
      setActivePoints((prev) => {
        if (!prev || prev.length === 0) return [worldPoint];
        // Ruler mode draws a straight line from the stroke's start to
        // the current pointer position — a real scratchboard "ruler"
        // without simulating a physical ruler graphic (CLAUDE.md
        // Section 13: "not need handwriting recognition... a
        // comfortable digital draft board" — a straight-line snap is
        // the minimal honest reading of "ruler" for that bar).
        if (rulerMode) return [prev[0]!, worldPoint];
        return [...prev, worldPoint];
      });
    }
  }

  function releasePointer(event: React.PointerEvent<HTMLCanvasElement>) {
    activePointers.current.delete(event.pointerId);
    if (activePointers.current.size < 2) gestureRef.current = null;
    if (drawingPointerId.current === event.pointerId) {
      endStroke();
      drawingPointerId.current = null;
    }
  }

  // React attaches onWheel as a passive listener by default, which
  // can't call preventDefault() (desktop mouse/trackpad zoom+pan needs
  // to stop the browser's own page-zoom/scroll) — a native listener
  // with `{ passive: false }` is the only way to actually claim the
  // gesture.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    function handleWheel(event: WheelEvent) {
      event.preventDefault();
      const rect = viewportRef.current!.getBoundingClientRect();
      const screenPoint = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      if (event.ctrlKey || event.metaKey) {
        const factor = Math.exp(-event.deltaY * 0.01);
        setViewport((current) => zoomAtPoint(current, screenPoint, factor));
      } else {
        setViewport((current) => panBy(current, -event.deltaX, -event.deltaY));
      }
    }
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, []);

  const zoomPercent = Math.round(viewport.zoom * 100);

  return (
    <div className={styles.board}>
      <div className={styles.toolbar}>
        <button
          type="button"
          className={clsx(styles.toolButton, tool === 'brush' && styles.toolButtonActive)}
          aria-label="Кисть"
          aria-pressed={tool === 'brush'}
          onClick={() => setTool('brush')}
        >
          <Icon name="brush" size={18} />
        </button>
        <button
          type="button"
          className={clsx(styles.toolButton, tool === 'eraser' && styles.toolButtonActive)}
          aria-label="Ластик"
          aria-pressed={tool === 'eraser'}
          onClick={() => setTool('eraser')}
        >
          <Icon name="eraser" size={18} />
        </button>
        <button
          type="button"
          className={clsx(styles.toolButton, rulerMode && styles.toolButtonActive)}
          aria-label="Линейка"
          aria-pressed={rulerMode}
          onClick={() => setRulerMode((v) => !v)}
        >
          <Icon name="ruler" size={18} />
        </button>

        <div className={styles.swatches}>
          {PALETTE.map((swatch) => (
            <button
              key={swatch}
              type="button"
              className={clsx(styles.swatch, color === swatch && styles.swatchActive)}
              style={{ background: swatch }}
              aria-label={`Цвет ${swatch}`}
              aria-pressed={color === swatch}
              onClick={() => setColor(swatch)}
            />
          ))}
        </div>

        <div className={styles.sizes}>
          {SIZES.map((s) => (
            <button
              key={s}
              type="button"
              className={clsx(styles.sizeButton, size === s && styles.sizeButtonActive)}
              aria-label={`Толщина ${s}`}
              aria-pressed={size === s}
              onClick={() => setSize(s)}
            >
              <span className={styles.sizeDot} style={{ width: s, height: s }} />
            </button>
          ))}
        </div>

        <button
          type="button"
          className={styles.toolButton}
          aria-label="Отменить"
          disabled={state.strokes.length === 0}
          onClick={() => onChangeState(undoStroke(state))}
        >
          <Icon name="undo" size={18} />
        </button>
        <button
          type="button"
          className={styles.toolButton}
          aria-label="Повторить"
          disabled={state.redoStack.length === 0}
          onClick={() => onChangeState(redoStroke(state))}
        >
          <Icon name="redo" size={18} />
        </button>
        <button
          type="button"
          className={styles.toolButton}
          aria-label="Очистить полотно"
          disabled={state.strokes.length === 0}
          onClick={() => onChangeState(clearCanvas())}
        >
          <Icon name="clear" size={18} />
        </button>

        {viewport.zoom !== 1 && (
          <button
            type="button"
            className={styles.zoomReset}
            onClick={() => setViewport(initialViewport())}
          >
            {zoomPercent}%
          </button>
        )}
      </div>

      <div className={styles.viewport} ref={viewportRef}>
        <div
          className={styles.world}
          style={{ transform: `translate(${viewport.panX}px, ${viewport.panY}px)` }}
        >
          <div
            ref={taskCardRef}
            className={styles.taskCard}
            style={{
              width: worldWidth || undefined,
              transform: `scale(${viewport.zoom})`,
              transformOrigin: '0 0',
            }}
          >
            <div className={styles.taskCardInner}>
              <p className={styles.taskLabel}>Задание №{task.number}</p>
              <div className={clsx('text-body-sm', styles.taskCondition)}>
                <MathText text={task.condition} />
              </div>
              <TaskExamIllustration
                subjectId={task.subjectId}
                taskNumber={task.number}
                className={styles.taskImage}
              />
              <TaskSolutionIllustration
                subjectId={task.subjectId}
                taskNumber={task.number}
                className={styles.taskImage}
              />
            </div>
          </div>

          <canvas
            ref={canvasRef}
            className={styles.canvas}
            style={{ width: worldWidth * viewport.zoom, height: worldHeight * viewport.zoom }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={releasePointer}
            onPointerLeave={releasePointer}
            onPointerCancel={releasePointer}
            role="img"
            aria-label="Рабочее полотно для рисования"
          />
        </div>
      </div>
    </div>
  );
}
