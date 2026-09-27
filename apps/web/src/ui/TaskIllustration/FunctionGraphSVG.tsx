import { useMemo } from 'react';

export interface FunctionGraphMarkedPoint {
  x: number;
  y: number;
  label: string;
  /** Label position relative to the point — avoids the label overlapping the curve/axis. */
  labelOffset?: { dx: number; dy: number };
}

export interface FunctionGraphSVGProps {
  /** The function to plot — sampled densely across [xMin, xMax]. */
  fn: (x: number) => number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  /** Grid line spacing on each axis (default 1). */
  gridStep?: number;
  /** Points to mark on the curve/axes (roots, intercepts, ...) with a filled dot + label. */
  points?: readonly FunctionGraphMarkedPoint[];
  ariaLabel: string;
}

const PADDING = 28;
const VIEW_W = 400;
const VIEW_H = 280;

/**
 * A real, mathematically plotted function graph (not a static image) —
 * for tasks where the graph's algebraic form is fully determined by
 * the task's own given data (e.g. a parabola whose roots/intercept are
 * derived in the solution), so the curve drawn here is exactly the
 * function described, not an approximation or invention.
 */
export function FunctionGraphSVG({
  fn,
  xMin,
  xMax,
  yMin,
  yMax,
  gridStep = 1,
  points = [],
  ariaLabel,
}: FunctionGraphSVGProps) {
  const plotW = VIEW_W - 2 * PADDING;
  const plotH = VIEW_H - 2 * PADDING;

  const toSvgX = (x: number) => PADDING + ((x - xMin) / (xMax - xMin)) * plotW;
  const toSvgY = (y: number) => PADDING + plotH - ((y - yMin) / (yMax - yMin)) * plotH;

  const curvePath = useMemo(() => {
    const steps = 200;
    const points: string[] = [];
    for (let i = 0; i <= steps; i += 1) {
      const x = xMin + (i / steps) * (xMax - xMin);
      const y = fn(x);
      if (y >= yMin - (yMax - yMin) * 0.2 && y <= yMax + (yMax - yMin) * 0.2) {
        points.push(`${i === 0 ? 'M' : 'L'} ${toSvgX(x).toFixed(2)} ${toSvgY(y).toFixed(2)}`);
      }
    }
    return points.join(' ');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fn, xMin, xMax, yMin, yMax]);

  const verticalGridLines = [];
  for (let x = Math.ceil(xMin / gridStep) * gridStep; x <= xMax; x += gridStep) {
    verticalGridLines.push(x);
  }
  const horizontalGridLines = [];
  for (let y = Math.ceil(yMin / gridStep) * gridStep; y <= yMax; y += gridStep) {
    horizontalGridLines.push(y);
  }

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      role="img"
      aria-label={ariaLabel}
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <rect x={0} y={0} width={VIEW_W} height={VIEW_H} fill="white" />

      {verticalGridLines.map((x) => (
        <line
          key={`v${x}`}
          x1={toSvgX(x)}
          y1={PADDING}
          x2={toSvgX(x)}
          y2={VIEW_H - PADDING}
          stroke="#dcdfe4"
          strokeWidth={1}
        />
      ))}
      {horizontalGridLines.map((y) => (
        <line
          key={`h${y}`}
          x1={PADDING}
          y1={toSvgY(y)}
          x2={VIEW_W - PADDING}
          y2={toSvgY(y)}
          stroke="#dcdfe4"
          strokeWidth={1}
        />
      ))}

      {/* Axes */}
      <line
        x1={PADDING}
        y1={toSvgY(0)}
        x2={VIEW_W - PADDING}
        y2={toSvgY(0)}
        stroke="#111827"
        strokeWidth={1.5}
        markerEnd="url(#fg-arrow)"
      />
      <line
        x1={toSvgX(0)}
        y1={VIEW_H - PADDING}
        x2={toSvgX(0)}
        y2={PADDING}
        stroke="#111827"
        strokeWidth={1.5}
        markerEnd="url(#fg-arrow)"
      />
      <defs>
        <marker id="fg-arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="#111827" />
        </marker>
      </defs>

      <text x={VIEW_W - PADDING + 10} y={toSvgY(0) + 4} fontSize={13} fontStyle="italic">
        x
      </text>
      <text x={toSvgX(0) - 14} y={PADDING - 8} fontSize={13} fontStyle="italic">
        y
      </text>
      <text x={toSvgX(0) + 4} y={toSvgY(0) + 14} fontSize={11}>
        0
      </text>

      {/* Axis tick labels for whole-number grid lines (skip 0, already labeled). */}
      {verticalGridLines
        .filter((x) => x !== 0)
        .map((x) => (
          <text key={`vx${x}`} x={toSvgX(x)} y={toSvgY(0) + 14} fontSize={11} textAnchor="middle">
            {x}
          </text>
        ))}
      {horizontalGridLines
        .filter((y) => y !== 0)
        .map((y) => (
          <text key={`hy${y}`} x={toSvgX(0) - 8} y={toSvgY(y) + 4} fontSize={11} textAnchor="end">
            {y}
          </text>
        ))}

      <path d={curvePath} fill="none" stroke="#111827" strokeWidth={2.5} />

      {points.map((p, i) => (
        <g key={i}>
          <circle cx={toSvgX(p.x)} cy={toSvgY(p.y)} r={3.5} fill="#111827" />
          <text
            x={toSvgX(p.x) + (p.labelOffset?.dx ?? 6)}
            y={toSvgY(p.y) + (p.labelOffset?.dy ?? -6)}
            fontSize={12}
          >
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
