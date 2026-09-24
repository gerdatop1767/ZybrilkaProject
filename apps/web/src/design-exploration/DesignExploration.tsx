import { useState } from 'react';
import { concepts } from './concepts/index.js';
import styles from './DesignExploration.module.css';

const VIEWPORTS = [
  { id: '375x812', label: '375×812', width: 375, height: 812 },
  { id: '390x844', label: '390×844', width: 390, height: 844 },
  { id: '430x932', label: '430×932', width: 430, height: 932 },
] as const;

const THUMB_SCALE = 0.28;

/**
 * Isolated design-exploration gallery (S1 Block 5 process change): 10
 * static Home-screen visual concepts, reachable only at #/design-
 * exploration, never linked from the production app shell. Nothing
 * here is wired to real navigation/task logic — it exists purely so
 * the concepts can be compared and one chosen before any of them gets
 * implemented for real.
 */
export function DesignExploration() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [viewportId, setViewportId] = useState<(typeof VIEWPORTS)[number]['id']>('390x844');

  const viewport = VIEWPORTS.find((v) => v.id === viewportId) ?? VIEWPORTS[1];
  const openIndex = concepts.findIndex((concept) => concept.id === openId);
  const open = openIndex >= 0 ? (concepts[openIndex] ?? null) : null;

  function step(delta: number) {
    if (openIndex < 0) return;
    const next = (openIndex + delta + concepts.length) % concepts.length;
    const nextConcept = concepts[next];
    if (nextConcept) setOpenId(nextConcept.id);
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>ZYBRILKA — DESIGN EXPLORATION</p>
          <h1 className={styles.title}>10 визуальных концепций Home</h1>
          <p className={styles.subtitle}>
            Только визуальные прототипы. Навигация, логика заданий и данные — не подключены.
          </p>
        </div>
        {open && (
          <button type="button" className={styles.backButton} onClick={() => setOpenId(null)}>
            ← Ко всем концепциям
          </button>
        )}
      </header>

      {!open && (
        <div className={styles.grid}>
          {concepts.map((concept) => (
            <button
              key={concept.id}
              type="button"
              className={styles.thumbCard}
              onClick={() => setOpenId(concept.id)}
            >
              <div
                className={styles.thumbFrame}
                style={{ width: 390 * THUMB_SCALE, height: 844 * THUMB_SCALE }}
              >
                <div
                  className={styles.thumbInner}
                  style={{ width: 390, height: 844, transform: `scale(${THUMB_SCALE})` }}
                >
                  <concept.Component />
                </div>
              </div>
              <p className={styles.thumbLabel}>
                <span className={styles.thumbNumber}>Concept {concept.number}</span>
                {concept.title}
              </p>
            </button>
          ))}
        </div>
      )}

      {open && (
        <div className={styles.inspect}>
          <div className={styles.inspectMeta}>
            <p className={styles.thumbNumber}>Concept {open.number}</p>
            <h2 className={styles.inspectTitle}>{open.title}</h2>
            <p className={styles.inspectDescription}>{open.description}</p>

            <div className={styles.viewportRow}>
              {VIEWPORTS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  className={
                    v.id === viewportId
                      ? `${styles.viewportButton} ${styles.viewportButtonActive}`
                      : styles.viewportButton
                  }
                  onClick={() => setViewportId(v.id)}
                >
                  {v.label}
                </button>
              ))}
            </div>

            <div className={styles.navRow}>
              <button type="button" className={styles.navButton} onClick={() => step(-1)}>
                ← Предыдущая
              </button>
              <button type="button" className={styles.navButton} onClick={() => step(1)}>
                Следующая →
              </button>
            </div>
          </div>

          <div
            className={styles.phoneFrame}
            style={{ width: viewport.width, height: viewport.height }}
          >
            <div className={styles.phoneScroll}>
              <open.Component />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
