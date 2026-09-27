/**
 * Task 1's diagram: isosceles triangle ABC (base AC, equal legs AB/BC),
 * angle bisector AF from vertex A meeting BC at F, angle B = 76°.
 * Schematic and not to scale (F's exact position along BC depends on
 * side lengths the task never gives) — same as the printed original,
 * which is also a not-to-scale sketch. Tick marks show AB = BC (the
 * only metric fact the task actually states); nothing else is implied.
 */
export function Task1TriangleSVG() {
  const A = { x: 50, y: 210 };
  const C = { x: 320, y: 210 };
  const B = { x: 170, y: 40 };
  // F on BC, schematic position only (not derivable from the given data).
  const F = { x: B.x + (C.x - B.x) * 0.32, y: B.y + (C.y - B.y) * 0.32 };

  function tickMark(p1: { x: number; y: number }, p2: { x: number; y: number }) {
    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);
    const nx = (-dy / len) * 6;
    const ny = (dx / len) * 6;
    return { x1: mx - nx, y1: my - ny, x2: mx + nx, y2: my + ny };
  }

  const tickAB = tickMark(A, B);
  const tickBC = tickMark(B, C);

  return (
    <svg
      viewBox="0 0 370 240"
      role="img"
      aria-label="Равнобедренный треугольник ABC с основанием AC, биссектрисой AF из вершины A и углом при вершине B равным 76°"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <rect x={0} y={0} width={370} height={240} fill="white" />

      <polygon
        points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`}
        fill="none"
        stroke="#111827"
        strokeWidth={2}
      />

      {/* Angle bisector AF */}
      <line x1={A.x} y1={A.y} x2={F.x} y2={F.y} stroke="#111827" strokeWidth={1.5} />
      <circle cx={F.x} cy={F.y} r={3} fill="#111827" />

      {/* Equal-leg tick marks (AB = BC) */}
      <line
        x1={tickAB.x1}
        y1={tickAB.y1}
        x2={tickAB.x2}
        y2={tickAB.y2}
        stroke="#111827"
        strokeWidth={1.5}
      />
      <line
        x1={tickBC.x1}
        y1={tickBC.y1}
        x2={tickBC.x2}
        y2={tickBC.y2}
        stroke="#111827"
        strokeWidth={1.5}
      />

      {/* Angle arc at B, labeled 76° */}
      <path
        d={`M ${B.x - 14} ${B.y + 22} A 26 26 0 0 1 ${B.x + 16} ${B.y + 20}`}
        fill="none"
        stroke="#2563eb"
        strokeWidth={1.5}
      />
      <text x={B.x - 6} y={B.y + 44} fontSize={13} fill="#2563eb">
        76°
      </text>

      {/* Bisected angle marks at A (two small equal arcs either side of AF) */}
      <path
        d={`M ${A.x + 20} ${A.y - 4} A 22 22 0 0 1 ${A.x + 24} ${A.y - 20}`}
        fill="none"
        stroke="#16a34a"
        strokeWidth={1.3}
      />
      <path
        d={`M ${A.x + 24} ${A.y - 20} A 22 22 0 0 1 ${A.x + 18} ${A.y - 34}`}
        fill="none"
        stroke="#16a34a"
        strokeWidth={1.3}
      />

      {/* Vertex labels */}
      <text x={A.x - 18} y={A.y + 6} fontSize={15} fontStyle="italic">
        A
      </text>
      <text x={C.x + 8} y={C.y + 6} fontSize={15} fontStyle="italic">
        C
      </text>
      <text x={B.x - 4} y={B.y - 10} fontSize={15} fontStyle="italic">
        B
      </text>
      <text x={F.x + 6} y={F.y - 4} fontSize={15} fontStyle="italic">
        F
      </text>
    </svg>
  );
}
