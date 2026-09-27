import { useMemo } from 'react';
import { CoordinatePlaneBase, type CoordinateTransform } from './CoordinatePlaneBase.js';

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
  return (
    <CoordinatePlaneBase
      xMin={xMin}
      xMax={xMax}
      yMin={yMin}
      yMax={yMax}
      gridStep={gridStep}
      ariaLabel={ariaLabel}
    >
      {({ toSvgX, toSvgY }: CoordinateTransform) => (
        <Curve
          fn={fn}
          xMin={xMin}
          xMax={xMax}
          yMin={yMin}
          yMax={yMax}
          toSvgX={toSvgX}
          toSvgY={toSvgY}
          points={points}
        />
      )}
    </CoordinatePlaneBase>
  );
}

function Curve({
  fn,
  xMin,
  xMax,
  yMin,
  yMax,
  toSvgX,
  toSvgY,
  points,
}: {
  fn: (x: number) => number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  toSvgX: (x: number) => number;
  toSvgY: (y: number) => number;
  points: readonly FunctionGraphMarkedPoint[];
}) {
  const curvePath = useMemo(() => {
    const steps = 200;
    const segments: string[] = [];
    for (let i = 0; i <= steps; i += 1) {
      const x = xMin + (i / steps) * (xMax - xMin);
      const y = fn(x);
      if (y >= yMin - (yMax - yMin) * 0.2 && y <= yMax + (yMax - yMin) * 0.2) {
        segments.push(`${i === 0 ? 'M' : 'L'} ${toSvgX(x).toFixed(2)} ${toSvgY(y).toFixed(2)}`);
      }
    }
    return segments.join(' ');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fn, xMin, xMax, yMin, yMax]);

  return (
    <>
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
    </>
  );
}
