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
import { Icon } from '../Icon/Icon.js';
import { clsx } from '../../lib/clsx.js';
import styles from './CanvasBoard.module.css';

/** Mirrors the design tokens' accent/status colors (tokens.css) —
 * canvas 2D fillStyle/strokeStyle needs literal color strings, not CSS
 * custom properties, so these are the same hex values by hand rather
 * than a new palette. */
const PALETTE = [
  '#f5f7fa', // --color-text-primary (white)
  '#8b14f5', // --color-accent-primary
  '#4da3ff', // --color-accent-secondary
  '#22c55e', // --color-success
  '#ff4a6b', // --color-error
  '#f5a623', // --color-warning / --color-gold
] as const;

const SIZES = [3, 6, 10] as const;

export interface CanvasBoardProps {
  state: CanvasState;
  onChangeState: (next: CanvasState) => void;
}

/**
 * The scratchboard's shared drawing core (Task Workspace block 4):
 * canvas + toolbar, identical between the mobile near-fullscreen
 * workspace and the desktop large modal — only their surrounding
 * chrome (header, task reference panel, overlay shape) differs. Owns
 * pointer-event → stroke translation and the live in-progress stroke;
 * committed strokes/undo/redo live in the caller's `state` (backed by
 * canvasSessionStore, not local to this component) so switching tasks
 * and coming back restores exactly where the drawing was left.
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

export function CanvasBoard({ state, onChangeState }: CanvasBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<CanvasTool>('brush');
  const [color, setColor] = useState<string>(PALETTE[1]);
  const [size, setSize] = useState<number>(SIZES[1]);
  const [rulerMode, setRulerMode] = useState(false);
  const [activePoints, setActivePoints] = useState<CanvasPoint[] | null>(null);
  const pointerIdRef = useRef<number | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    for (const stroke of state.strokes) paintStroke(ctx, stroke);
    if (activePoints && activePoints.length > 0) {
      paintStroke(ctx, { points: activePoints, tool, color, size });
    }
  }, [state.strokes, activePoints, tool, color, size]);

  // Sizes the backing bitmap to the container's real pixels (device
  // pixel ratio aware) whenever the panel resizes — a canvas left at
  // its default 300x150 attribute size would stretch/blur on any
  // larger surface, and mobile vs desktop workspaces render this at
  // very different sizes.
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    function resize() {
      const canvas2 = canvasRef.current;
      const container2 = containerRef.current;
      if (!canvas2 || !container2) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = container2.getBoundingClientRect();
      canvas2.width = Math.max(1, Math.round(rect.width * dpr));
      canvas2.height = Math.max(1, Math.round(rect.height * dpr));
      const ctx = canvas2.getContext('2d');
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();
    return () => observer.disconnect();
  }, [draw]);

  useEffect(() => {
    draw();
  }, [draw]);

  function pointFromEvent(event: React.PointerEvent<HTMLCanvasElement>): CanvasPoint {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerIdRef.current = event.pointerId;
    setActivePoints([pointFromEvent(event)]);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (pointerIdRef.current !== event.pointerId) return;
    const point = pointFromEvent(event);
    setActivePoints((prev) => {
      if (!prev || prev.length === 0) return [point];
      // Ruler mode draws a straight line from the stroke's start to
      // the current pointer position — a real scratchboard "ruler"
      // without simulating a physical ruler graphic (CLAUDE.md Section
      // 13: "not need handwriting recognition... a comfortable digital
      // draft board" — a straight-line snap is the minimal honest
      // reading of "ruler" for that bar).
      if (rulerMode) return [prev[0]!, point];
      return [...prev, point];
    });
  }

  function endStroke() {
    pointerIdRef.current = null;
    if (activePoints && activePoints.length > 0) {
      onChangeState(commitStroke(state, { points: activePoints, tool, color, size }));
    }
    setActivePoints(null);
  }

  function handlePointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    if (pointerIdRef.current !== event.pointerId) return;
    endStroke();
  }

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
      </div>

      <div className={styles.canvasWrap} ref={containerRef}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
          role="img"
          aria-label="Рабочее полотно для рисования"
        />
      </div>
    </div>
  );
}
