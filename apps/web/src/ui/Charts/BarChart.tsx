import styles from './BarChart.module.css';

export interface BarChartPoint {
  label: string;
  value: number;
}

export interface BarChartProps {
  points: readonly BarChartPoint[];
  /** Show every Nth label to avoid crowding on long series. */
  labelEvery?: number;
  className?: string;
}

/**
 * Lightweight CSS bar chart (Statistics — "Активность по дням"). Plain
 * DOM bars scaled by height, not an image or a chart library: real
 * values are readable via `title`/`aria-label` and grow in with a
 * single CSS transform animation.
 */
export function BarChart({ points, labelEvery = 1, className }: BarChartProps) {
  const max = Math.max(1, ...points.map((p) => p.value));

  return (
    <div>
      <div
        className={`${styles.chart} ${className ?? ''}`}
        role="img"
        aria-label="График активности по дням"
      >
        {points.map((p, i) => (
          <div key={i} className={styles.barTrack}>
            <div
              className={styles.bar}
              style={{ height: `${(p.value / max) * 100}%`, animationDelay: `${i * 12}ms` }}
              title={`${p.label}: ${p.value}`}
            />
          </div>
        ))}
      </div>
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
