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
 * Task 3's own diagram (EGE Fidelity audit, Block 6): the source PDF
 * DOES print a picture here — two bare, unlabelled cylinder outlines,
 * the second visibly taller and narrower than the first, no text of
 * any kind on the drawing itself (V₁/V₂ only appear in the problem's
 * prose). An earlier pass wrongly assumed this task had no picture and
 * added "V₁ = 102" / "V₂ = ?" labels that never existed in the
 * original — removed here to match the source exactly: shape and
 * relative proportions only (height ×3, radius ÷2), nothing written on
 * the figure.
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
    </svg>
  );
}
