import { useMemo } from 'react';

const VIEW_W = 560;
const VIEW_H = 280;
const PAD_LEFT = 34;
const PAD_RIGHT = 34;
const PAD_TOP = 24;
const PAD_BOTTOM = 34;

const X_MIN = -23;
const X_MAX = 3.5;
const Y_MIN = -3.4;
const Y_MAX = 3.6;

function toSvgX(x: number) {
  return PAD_LEFT + ((x - X_MIN) / (X_MAX - X_MIN)) * (VIEW_W - PAD_LEFT - PAD_RIGHT);
}
function toSvgY(y: number) {
  return PAD_TOP + (1 - (y - Y_MIN) / (Y_MAX - Y_MIN)) * (VIEW_H - PAD_TOP - PAD_BOTTOM);
}

/**
 * Task 8's own printed graph — read directly off its grid (EGE
 * Fidelity audit, Blocks 4/6): $y=f'(x)$ on the open interval
 * $(-22;2)$, open circles at both ends (the endpoints are excluded),
 * a wavy curve with local peaks/troughs, and the sign changes the
 * problem actually turns on. Every waypoint below is a grid-square
 * reading of the printed curve (the same "count the squares" method
 * the exam itself expects a student to use — this is not an exact
 * algebraic function, so there is no formula to plot instead), kept
 * consistent with the independently re-solved step-by-step solution:
 * f'(x) crosses zero going + → − (a maximum of f) at x≈-13 and x≈-3,
 * and − → + (a minimum) at x≈-9 and x≈-0.6; the humps around
 * x≈-20, -8, -6 and 0 rise and fall again without crossing the axis,
 * so they contribute no extremum of f. Labels reproduce exactly what
 * the original marks: "y", "x", "0", "1", "2" on the axes, "-22" at
 * the left endpoint, "1" on the y-axis (the right endpoint's height),
 * and the "$y=f'(x)$" caption on the curve — nothing else.
 */
export function Task8DerivativeGraphSVG() {
  // [x, y] waypoints tracing the printed curve left to right. Not an
  // algebraic function — see the module comment above.
  const waypoints: readonly [number, number][] = [
    [-22, -1.8],
    [-21.3, -0.9],
    [-20.4, 0.9],
    [-19.3, 1.9],
    [-18.3, 1.4],
    [-16.8, -0.2],
    [-15.3, -2.3],
    [-14, -1.6],
    [-13, 0],
    [-12.1, 1.1],
    [-10.8, 2.4],
    [-9.6, 1.6],
    [-9, 0],
    [-8.4, -0.9],
    [-7.9, -0.7],
    [-7.3, -0.2],
    [-6.6, -0.9],
    [-6, -1.6],
    [-5.3, -0.4],
    [-4.3, 1.4],
    [-3.6, 2.1],
    [-3, 0],
    [-2.3, -1.3],
    [-1.5, -2.5],
    [-0.9, -1.6],
    [-0.6, 0],
    [-0.1, 1.4],
    [0.5, 2.5],
    [1, 2.9],
    [1.5, 2.2],
    [1.85, 1.3],
    [2, 1],
  ];

  const curvePath = useMemo(() => {
    return waypoints
      .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${toSvgX(x).toFixed(1)} ${toSvgY(y).toFixed(1)}`)
      .join(' ');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = waypoints[0]!;
  const end = waypoints[waypoints.length - 1]!;

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      role="img"
      aria-label="График y = f'(x) на интервале (-22;2): волнообразная кривая, меняющая знак с плюса на минус в двух точках отрезка [-18;1]"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {/* Axes */}
      <line
        x1={toSvgX(X_MIN + 0.4)}
        y1={toSvgY(0)}
        x2={toSvgX(X_MAX - 0.3)}
        y2={toSvgY(0)}
        stroke="var(--color-text-primary)"
        strokeWidth={1.5}
      />
      <line
        x1={toSvgX(0)}
        y1={toSvgY(Y_MIN + 0.2)}
        x2={toSvgX(0)}
        y2={toSvgY(Y_MAX - 0.2)}
        stroke="var(--color-text-primary)"
        strokeWidth={1.5}
      />
      <path
        d="M0,0 L-6,-3 L-6,3 Z"
        fill="var(--color-text-primary)"
        transform={`translate(${toSvgX(X_MAX - 0.3)}, ${toSvgY(0)})`}
      />
      <path
        d="M0,0 L-3,6 L3,6 Z"
        fill="var(--color-text-primary)"
        transform={`translate(${toSvgX(0)}, ${toSvgY(Y_MAX - 0.2)})`}
      />

      {/* Axis labels — exactly what the original marks, nothing more */}
      <text
        x={toSvgX(X_MAX - 0.3) + 8}
        y={toSvgY(0) + 4}
        fontSize={13}
        fontStyle="italic"
        fill="var(--color-text-secondary)"
      >
        x
      </text>
      <text
        x={toSvgX(0) - 14}
        y={toSvgY(Y_MAX - 0.2) - 4}
        fontSize={13}
        fontStyle="italic"
        fill="var(--color-text-secondary)"
      >
        y
      </text>
      <text
        x={toSvgX(-22)}
        y={toSvgY(0) + 16}
        fontSize={12}
        textAnchor="middle"
        fill="var(--color-text-secondary)"
      >
        -22
      </text>
      <text x={toSvgX(0) + 3} y={toSvgY(0) + 15} fontSize={12} fill="var(--color-text-secondary)">
        0
      </text>
      <text
        x={toSvgX(1)}
        y={toSvgY(0) + 15}
        fontSize={12}
        textAnchor="middle"
        fill="var(--color-text-secondary)"
      >
        1
      </text>
      <text
        x={toSvgX(2)}
        y={toSvgY(0) + 15}
        fontSize={12}
        textAnchor="middle"
        fill="var(--color-text-secondary)"
      >
        2
      </text>
      <line
        x1={toSvgX(0) - 4}
        y1={toSvgY(1)}
        x2={toSvgX(0) + 4}
        y2={toSvgY(1)}
        stroke="var(--color-text-secondary)"
        strokeWidth={1}
      />
      <text x={toSvgX(0) + 7} y={toSvgY(1) + 4} fontSize={12} fill="var(--color-text-secondary)">
        1
      </text>

      {/* The curve, matching the original's caption placement */}
      <path d={curvePath} fill="none" stroke="var(--color-text-primary)" strokeWidth={2.25} />
      <text
        x={toSvgX(-13.5)}
        y={toSvgY(2.35)}
        fontSize={13}
        fontStyle="italic"
        fill="var(--color-text-primary)"
      >
        y = f&apos;(x)
      </text>

      {/* Open circles at both excluded endpoints — the interval is (-22;2) */}
      <circle
        cx={toSvgX(start[0])}
        cy={toSvgY(start[1])}
        r={4}
        fill="var(--color-bg-surface)"
        stroke="var(--color-text-primary)"
        strokeWidth={1.6}
      />
      <circle
        cx={toSvgX(end[0])}
        cy={toSvgY(end[1])}
        r={4}
        fill="var(--color-bg-surface)"
        stroke="var(--color-text-primary)"
        strokeWidth={1.6}
      />
    </svg>
  );
}
