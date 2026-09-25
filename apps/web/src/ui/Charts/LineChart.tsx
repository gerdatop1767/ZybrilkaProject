import { useId } from 'react';
import styles from './LineChart.module.css';

export interface LineChartPoint {
  label: string;
  value: number;
}

export interface LineChartProps {
  points: readonly LineChartPoint[];
  max?: number;
  labelEvery?: number;
  className?: string;
}

const VIEW_W = 600;
const VIEW_H = 160;

/**
 * Lightweight SVG line chart (Statistics — "Динамика правильных
 * ответов"). A real inline `<svg>` — polyline + filled area + dots —
 * not a screenshot or a chart library.
 */
export function LineChart({ points, max = 100, labelEvery = 1, className }: LineChartProps) {
  const gradientId = useId();
  if (points.length === 0) return null;

  const stepX = points.length > 1 ? VIEW_W / (points.length - 1) : 0;
  const coords = points.map((p, i) => {
    const x = i * stepX;
    const y = VIEW_H - (Math.min(max, p.value) / max) * VIEW_H;
    return { x, y, ...p };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x},${c.y}`).join(' ');
  const areaPath = `${linePath} L${coords.at(-1)!.x},${VIEW_H} L0,${VIEW_H} Z`;

  return (
    <div className={styles.wrap}>
      <svg
        className={`${styles.svg} ${className ?? ''}`}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="График динамики правильных ответов"
      >
        <defs>
          <linearGradient id={`lineChartGradient-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent-primary-end)" />
            <stop offset="100%" stopColor="var(--color-accent-primary-end)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          className={styles.area}
          d={areaPath}
          style={{ fill: `url(#lineChartGradient-${gradientId})` }}
        />
        <path className={styles.line} d={linePath} />
        {coords.map((c, i) => (
          <circle key={i} className={styles.dot} cx={c.x} cy={c.y} r={3}>
            <title>
              {c.label}: {c.value}%
            </title>
          </circle>
        ))}
      </svg>
      <div className={styles.labels}>
        {points.map((p, i) => (
          <span key={i} className={styles.labelCell}>
            {i % labelEvery === 0 && <span>{p.label}</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
