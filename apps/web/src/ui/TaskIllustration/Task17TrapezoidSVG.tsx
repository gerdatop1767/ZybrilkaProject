/**
 * Task 17's own diagram, even though the source PDF prints none (a
 * Part 2 problem where the student is expected to draw their own).
 * Built from the exact coordinates the solution derives, scaled to
 * R=1: D=(0,0), A=(0,2), C=(2+√2,0), B=(√2,2), inscribed circle
 * O=(1,1) r=1, tangent point G=(1,2) on AB, and N=(c/2,c/2) where the
 * bisector from D meets BC — so every position here is mathematically
 * exact, not eyeballed.
 */
export function Task17TrapezoidSVG() {
  const SCALE = 60;
  const PADDING = 34;

  const toSvg = (mathX: number, mathY: number) => ({ x: mathX * SCALE, y: -mathY * SCALE });

  const sqrt2 = Math.SQRT2;
  const c = 2 + sqrt2;
  const rawPoints = {
    D: toSvg(0, 0),
    A: toSvg(0, 2),
    C: toSvg(c, 0),
    B: toSvg(sqrt2, 2),
    O: toSvg(1, 1),
    G: toSvg(1, 2),
    N: toSvg(c / 2, c / 2),
  };
  const r = SCALE;

  // Auto-fit the viewBox to the trapezoid + circle, instead of a fixed
  // canvas with leftover empty space — the circle's own bounds (O±r)
  // need including since it extends past the trapezoid's corners.
  const xs = [...Object.values(rawPoints).map((p) => p.x), rawPoints.O.x - r, rawPoints.O.x + r];
  const ys = [...Object.values(rawPoints).map((p) => p.y), rawPoints.O.y - r, rawPoints.O.y + r];
  const minX = Math.min(...xs) - PADDING;
  const maxX = Math.max(...xs) + PADDING;
  const minY = Math.min(...ys) - PADDING;
  const maxY = Math.max(...ys) + PADDING;
  const viewW = maxX - minX;
  const viewH = maxY - minY;
  const shift = (p: { x: number; y: number }) => ({ x: p.x - minX, y: p.y - minY });

  const D = shift(rawPoints.D);
  const A = shift(rawPoints.A);
  const C = shift(rawPoints.C);
  const B = shift(rawPoints.B);
  const O = shift(rawPoints.O);
  const G = shift(rawPoints.G);
  const N = shift(rawPoints.N);

  return (
    <svg
      viewBox={`0 0 ${viewW} ${viewH}`}
      role="img"
      aria-label="Прямоугольная трапеция ABCD с вписанной окружностью центра O, точкой касания G на AB и точкой N на BC"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <rect x={0} y={0} width={viewW} height={viewH} fill="white" />

      {/* The kite BNOG referenced in part б, filled softly for context */}
      <polygon
        points={`${B.x},${B.y} ${N.x},${N.y} ${O.x},${O.y} ${G.x},${G.y}`}
        fill="#2563eb"
        fillOpacity={0.08}
      />

      <polygon
        points={`${D.x},${D.y} ${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`}
        fill="none"
        stroke="#111827"
        strokeWidth={2}
      />

      <circle cx={O.x} cy={O.y} r={r} fill="none" stroke="#111827" strokeWidth={1.5} />
      <circle cx={O.x} cy={O.y} r={2.5} fill="#111827" />

      {/* Right-angle marks at A and D */}
      <polyline
        points={`${A.x},${A.y - 12} ${A.x + 12},${A.y - 12} ${A.x + 12},${A.y}`}
        fill="none"
        stroke="#111827"
        strokeWidth={1.2}
      />
      <polyline
        points={`${D.x},${D.y - 12} ${D.x + 12},${D.y - 12} ${D.x + 12},${D.y}`}
        fill="none"
        stroke="#111827"
        strokeWidth={1.2}
      />

      {/* Bisector from D to N */}
      <line x1={D.x} y1={D.y} x2={N.x} y2={N.y} stroke="#2563eb" strokeWidth={1.5} />

      {/* Radius OG */}
      <line
        x1={O.x}
        y1={O.y}
        x2={G.x}
        y2={G.y}
        stroke="#16a34a"
        strokeWidth={1.3}
        strokeDasharray="3 3"
      />
      <text x={O.x + 6} y={(O.y + G.y) / 2} fontSize={11} fill="#16a34a">
        R
      </text>

      {[
        { p: D, label: 'D', dx: -14, dy: 16 },
        { p: A, label: 'A', dx: -14, dy: -4 },
        { p: B, label: 'B', dx: 6, dy: -8 },
        { p: C, label: 'C', dx: 8, dy: 16 },
        { p: O, label: 'O', dx: -16, dy: 4 },
        { p: G, label: 'G', dx: 8, dy: -4 },
        { p: N, label: 'N', dx: 8, dy: 2 },
      ].map(({ p, label, dx, dy }) => (
        <g key={label}>
          <circle cx={p.x} cy={p.y} r={2.2} fill="#111827" />
          <text x={p.x + dx} y={p.y + dy} fontSize={14} fontStyle="italic">
            {label}
          </text>
        </g>
      ))}
    </svg>
  );
}
