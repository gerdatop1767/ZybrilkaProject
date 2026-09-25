import { useState } from 'react';
import {
  whyFeatures,
  principlesDesktop,
  aboutStats,
  aboutGoals,
  faqItems,
} from '../../data/sampleAbout.js';
import { Icon } from '../../ui/Icon/Icon.js';
import { Collapse, FadeIn } from '../../ui/motion/motion.js';
import { clsx } from '../../lib/clsx.js';
import styles from './AboutDesktop.module.css';

const principleColors = [
  'var(--chart-1)',
  'var(--color-success)',
  'var(--color-warning)',
  'var(--chart-2)',
];
const whyColors = ['var(--chart-1)', 'var(--chart-3)', 'var(--chart-6)', 'var(--color-success)'];

/**
 * Desktop О проекте (S1 Block 6, approved design —
 * desktop/11_about.png). Static product copy from `data/
 * sampleAbout.ts`, the pre-extracted hero illustration asset, and a
 * real collapsible FAQ list — reproduced as close to the approved
 * composition as the visible text allows.
 */
export function AboutDesktop() {
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  return (
    <FadeIn className={styles.page}>
      <div>
        <h1 className="text-h1">О проекте</h1>
        <p className="text-body-sm text-secondary">
          Zybrilka — бесплатный тренажёр для подготовки к ЕГЭ
        </p>
      </div>

      <div className={styles.grid}>
        <div className={styles.main}>
          <div className={styles.heroCard}>
            <div>
              <span className={styles.heroBadge}>Наша цель</span>
              <h2 className={`text-h1 ${styles.heroHeading}`}>
                Сделать подготовку к ЕГЭ{' '}
                <span className={styles.heroAccent}>проще, удобнее и эффективнее</span>
              </h2>
              <p className="text-body text-secondary">
                Современный тренажёр с актуальными заданиями, понятными объяснениями и удобной
                статистикой — всё, что нужно для уверенной сдачи ЕГЭ.
              </p>
            </div>
            <img
              src="/branding/v2/about-illustration-desktop.webp"
              alt=""
              className={styles.heroIllustration}
            />
          </div>

          <div>
            <p className="text-h3" style={{ marginBottom: 'var(--space-3)' }}>
              Наши принципы
            </p>
            <div className={styles.cardsGrid}>
              {principlesDesktop.map((item, i) => (
                <div
                  key={item.title}
                  className={styles.principleCard}
                  style={{ ['--accent' as string]: principleColors[i % principleColors.length] }}
                >
                  <span className={styles.iconTile}>
                    <Icon name={item.icon} size={22} />
                  </span>
                  <div>
                    <p className="text-body" style={{ fontWeight: 700 }}>
                      {item.title}
                    </p>
                    <p className="text-body-sm text-secondary">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-h3" style={{ marginBottom: 'var(--space-3)' }}>
              Zybrilka в цифрах
            </p>
            <div className={styles.statsGrid}>
              {aboutStats.map((stat) => (
                <div key={stat.label} className={styles.statCard}>
                  <span className={styles.iconTile} style={{ ['--accent' as string]: stat.color }}>
                    <Icon name={stat.icon} size={20} />
                  </span>
                  <div>
                    <p className="text-h2">{stat.value}</p>
                    <p className="text-body-sm text-secondary">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.sidebar}>
          <div
            style={{
              padding: 'var(--space-4)',
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <p className="text-h3">Почему Zybrilka?</p>
            <div className={styles.whyGrid}>
              {whyFeatures.map((item, i) => (
                <div
                  key={item.title}
                  className={styles.whyCard}
                  style={{ ['--accent' as string]: whyColors[i % whyColors.length] }}
                >
                  <span className={styles.iconTile}>
                    <Icon name={item.icon} size={20} />
                  </span>
                  <p className="text-body-sm" style={{ fontWeight: 700 }}>
                    {item.title}
                  </p>
                  <p className="text-body-sm text-secondary">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              padding: 'var(--space-4)',
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <div className={styles.sectionHeaderRow}>
              <p className="text-h3">Наши цели</p>
              <span className="text-body-sm text-secondary">Планы развития →</span>
            </div>
            <div className={styles.goalsList}>
              {aboutGoals.map((goal) => (
                <div key={goal.index} className={styles.goalRow}>
                  <span className={styles.goalIndex} style={{ ['--accent' as string]: goal.color }}>
                    {goal.index}
                  </span>
                  <div>
                    <p className="text-body-sm" style={{ fontWeight: 700 }}>
                      {goal.title}
                    </p>
                    <p className="text-body-sm text-secondary">{goal.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              padding: 'var(--space-4)',
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <div className={styles.sectionHeaderRow}>
              <p className="text-h3">Частые вопросы</p>
              <span className="text-body-sm text-secondary">Все вопросы →</span>
            </div>
            <div className={styles.faqList}>
              {faqItems.map((item) => {
                const open = openFaq === item.id;
                return (
                  <div key={item.id}>
                    <button
                      type="button"
                      className={styles.faqRow}
                      aria-expanded={open}
                      onClick={() => setOpenFaq(open ? null : item.id)}
                    >
                      <span className="text-body-sm">{item.question}</span>
                      <Icon name={open ? 'chevronUp' : 'chevronDown'} size={16} />
                    </button>
                    <Collapse open={open}>
                      <p className={clsx('text-body-sm', styles.faqAnswer)}>{item.answer}</p>
                    </Collapse>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}
