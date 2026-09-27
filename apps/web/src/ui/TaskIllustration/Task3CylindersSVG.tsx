interface CylinderProps {
  x: number;
  baseY: number;
  radiusX: number;
  height: number;
}

const ELLIPSE_RY_RATIO = 0.28;

function Cylinder({ x, baseY, radiusX, height }: CylinderProps) {
  const ry = radiusX * ELLIPSE_RY_RATIO;
  const topY = baseY - height;
  return (
    <g>
      {/* Sides */}
      <line
        x1={x - radiusX}
        y1={baseY}
        x2={x - radiusX}
        y2={topY}
        stroke="var(--color-text-primary)"
        strokeWidth={1.8}
      />
      <line
        x1={x + radiusX}
        y1={baseY}
        x2={x + radiusX}
        y2={topY}
        stroke="var(--color-text-primary)"
        strokeWidth={1.8}
      />
      {/* Bottom ellipse: front arc solid, back arc dashed */}
      <path
        d={`M ${x - radiusX} ${baseY} A ${radiusX} ${ry} 0 0 0 ${x + radiusX} ${baseY}`}
        fill="none"
        stroke="var(--color-text-primary)"
        strokeWidth={1.8}
      />
      <path
        d={`M ${x - radiusX} ${baseY} A ${radiusX} ${ry} 0 0 1 ${x + radiusX} ${baseY}`}
        fill="none"
        stroke="var(--color-text-secondary)"
        strokeWidth={1}
        strokeDasharray="3 3"
      />
      {/* Top ellipse: fully visible */}
      <ellipse
        cx={x}
        cy={topY}
        rx={radiusX}
        ry={ry}
        fill="none"
        stroke="var(--color-text-primary)"
        strokeWidth={1.8}
      />
    </g>
  );
}

/**
 * Task 3 gives no picture in the source at all (a text-only problem —
 * "Дано два цилиндра...") and names no r/h symbols, only the ratios
 * between the two cylinders (height ×3, radius ÷2) and V₁=102. So this
 * schematic shows only what the condition actually states: two
 * cylinders drawn in that same proportion (second visibly taller and
 * narrower) with just V₁=102 and V₂=? labelled — no invented r/h
 * annotations that never appear in the original text.
 */
export function Task3CylindersSVG() {
  const baseY = 190;
  const r1 = 55;
  const h1 = 70;
  return (
    <svg
      viewBox="0 0 340 220"
      role="img"
      aria-label="Два цилиндра: у второго высота втрое больше, а радиус вдвое меньше, чем у первого"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <Cylinder x={85} baseY={baseY} radiusX={r1} height={h1} />
      <Cylinder x={255} baseY={baseY} radiusX={r1 / 2} height={h1 * 1.6} />

      <text
        x={85}
        y={baseY + 22}
        fontSize={13}
        textAnchor="middle"
        fill="var(--color-text-primary)"
      >
        V₁ = 102
      </text>
      <text
        x={255}
        y={baseY + 22}
        fontSize={13}
        textAnchor="middle"
        fill="var(--color-text-primary)"
      >
        V₂ = ?
      </text>
    </svg>
  );
}
