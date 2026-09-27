/**
 * Task 14's own diagram — a Part 2 problem the source PDF prints with
 * no picture (students are expected to draw their own). Coordinates
 * come straight from the solution's own coordinate method: A=(0,0,0),
 * B=(a,0,0), C=(a,a,0), D=(0,a,0), S=(0,0,h) with the real a=AB=2√3,
 * h=SA=6, K the midpoint of SB, and N=(a/3,a/3,h/3) — the exact point
 * where DK meets plane SAC (re-derived here from the same equations
 * the solution describes, not eyeballed). Projected with a standard
 * oblique (cavalier) projection: screen x = x + y·cos45°, screen
 * "up" = z + y·sin45°, the same convention used in printed textbooks
 * for drawing a 3D square base as a parallelogram.
 */
export function Task14PyramidSVG() {
  const a = 2 * Math.sqrt(3);
  const h = 6;
  const DEPTH = Math.SQRT1_2; // cos(45°) = sin(45°)
  const SCALE = 28;
  const PADDING = 40;

  function project(x: number, y: number, z: number) {
    const screenX = (x + y * DEPTH) * SCALE;
    const up = (z + y * DEPTH) * SCALE;
    return { x: screenX, y: -up };
  }

  const A = project(0, 0, 0);
  const B = project(a, 0, 0);
  const C = project(a, a, 0);
  const D = project(0, a, 0);
  const S = project(0, 0, h);
  const K = project(a / 2, 0, h / 2);
  const N = project(a / 3, a / 3, h / 3);

  const allPoints = [A, B, C, D, S, K, N];
  const minX = Math.min(...allPoints.map((p) => p.x));
  const maxX = Math.max(...allPoints.map((p) => p.x));
  const minY = Math.min(...allPoints.map((p) => p.y));
  const maxY = Math.max(...allPoints.map((p) => p.y));
  const viewW = maxX - minX + 2 * PADDING;
  const viewH = maxY - minY + 2 * PADDING;
  const dx = PADDING - minX;
  const dy = PADDING - minY;
  const shift = (p: { x: number; y: number }) => ({ x: p.x + dx, y: p.y + dy });

  const As = shift(A);
  const Bs = shift(B);
  const Cs = shift(C);
  const Ds = shift(D);
  const Ss = shift(S);
  const Ks = shift(K);
  const Ns = shift(N);

  const solid = { stroke: '#111827', strokeWidth: 1.8, fill: 'none' } as const;
  const hidden = {
    stroke: '#9ca3af',
    strokeWidth: 1.3,
    fill: 'none',
    strokeDasharray: '4 3',
  } as const;

  function leaderLabel(p: { x: number; y: number }, label: string, lx: number, ly: number) {
    return (
      <g key={label}>
        <circle cx={p.x} cy={p.y} r={2.4} fill="#111827" />
        <line x1={p.x} y1={p.y} x2={lx} y2={ly} stroke="#9ca3af" strokeWidth={0.8} />
        <text x={lx} y={ly} fontSize={13} fontStyle="italic" textAnchor="middle">
          {label}
        </text>
      </g>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${viewW} ${viewH}`}
      role="img"
      aria-label="Пирамида SABCD с квадратным основанием ABCD, высотой SA, точкой K — серединой SB, и точкой N пересечения DK с плоскостью SAC"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <rect x={0} y={0} width={viewW} height={viewH} fill="white" />

      {/* Hidden (back) base edges + diagonal AC */}
      <line x1={Bs.x} y1={Bs.y} x2={Cs.x} y2={Cs.y} {...hidden} />
      <line x1={Cs.x} y1={Cs.y} x2={Ds.x} y2={Ds.y} {...hidden} />
      <line x1={As.x} y1={As.y} x2={Cs.x} y2={Cs.y} {...hidden} />
      <line x1={Ss.x} y1={Ss.y} x2={Cs.x} y2={Cs.y} {...hidden} />

      {/* Visible base + lateral edges */}
      <line x1={As.x} y1={As.y} x2={Bs.x} y2={Bs.y} {...solid} />
      <line x1={As.x} y1={As.y} x2={Ds.x} y2={Ds.y} {...solid} />
      <line x1={As.x} y1={As.y} x2={Ss.x} y2={Ss.y} {...solid} />
      <line x1={Ss.x} y1={Ss.y} x2={Bs.x} y2={Bs.y} {...solid} />
      <line x1={Ss.x} y1={Ss.y} x2={Ds.x} y2={Ds.y} {...solid} />

      {/* DK with N marked on it */}
      <line x1={Ds.x} y1={Ds.y} x2={Ks.x} y2={Ks.y} stroke="#2563eb" strokeWidth={1.6} />

      {leaderLabel(As, 'A', As.x - 16, As.y + 4)}
      {leaderLabel(Bs, 'B', Bs.x + 14, Bs.y + 4)}
      {leaderLabel(Cs, 'C', Cs.x + 14, Cs.y)}
      {leaderLabel(Ss, 'S', Ss.x - 4, Ss.y - 10)}
      {leaderLabel(Ds, 'D', Ds.x - 26, Ds.y + 14)}
      {leaderLabel(Ks, 'K', Ks.x + 30, Ks.y - 12)}
      {leaderLabel(Ns, 'N', Ns.x - 28, Ns.y + 16)}
    </svg>
  );
}
