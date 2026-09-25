import { Fragment, useState } from 'react';
import { subjects } from '../../data/subjects.js';
import { sampleTask } from '../../data/sampleTask.js';
import { useNavigation } from '../../lib/navigation.js';
import {
  whyFeaturesMobile,
  principlesMobile,
  howItWorks,
  faqItems,
} from '../../data/sampleAbout.js';
import { Icon } from '../../ui/Icon/Icon.js';
import { Tabs } from '../../ui/Tabs/Tabs.js';
import { SubjectHeaderMobile } from '../../ui/SubjectHeader/SubjectHeaderMobile.js';
import { WipPlaceholder } from '../../ui/WipPlaceholder/WipPlaceholder.js';
import { Collapse, SlideUp } from '../../ui/motion/motion.js';
import { clsx } from '../../lib/clsx.js';
import styles from './AboutMobile.module.css';

const tabs = [
  { id: 'about', label: 'О проекте' },
  { id: 'team', label: 'Команда' },
  { id: 'plans', label: 'Планы' },
  { id: 'support', label: 'Поддержка' },
];

const featureColors = [
  'var(--chart-1)',
  'var(--chart-6)',
  'var(--color-success)',
  'var(--color-gold)',
];
const principleColors = [
  'var(--color-warning)',
  'var(--color-accent-primary-end)',
  'var(--color-error)',
];

/**
 * Mobile О проекте (S1 Block 6, approved design —
 * mobile/11_about.png): the "О проекте" tab reproduces the approved
 * composition (hero + illustration, feature icons, principles, "Как
 * это работает?" steps, FAQ). The other three tabs have no approved
 * screenshot yet, so they show the same honest WIP placeholder used
 * elsewhere rather than an invented layout.
 */
export function AboutMobile() {
  const { back } = useNavigation();
  const subject = subjects.find((s) => s.id === sampleTask.subjectId) ?? subjects[0]!;
  const [tab, setTab] = useState('about');
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  return (
    <SlideUp className={styles.stack}>
      <SubjectHeaderMobile subject={subject} title="О проекте" onBack={back} />

      <Tabs items={tabs} activeId={tab} onChange={setTab} aria-label="Раздел о проекте" />

      {tab !== 'about' ? (
        <WipPlaceholder
          title={tabs.find((t) => t.id === tab)!.label}
          note="Экран в разработке — следующий блок."
        />
      ) : (
        <>
          <div className={styles.heroCard}>
            <h1 className={`text-h1 ${styles.heroTitle}`}>Зубрилка</h1>
            <p className={`text-body ${styles.heroSubtitle}`}>
              Современный тренажёр для подготовки к ЕГЭ
            </p>
            <p className="text-body-sm text-secondary">
              Наша цель — сделать подготовку к ЕГЭ удобной, интересной и эффективной. Мы объединяем
              актуальные задания, умные пояснения и удобный интерфейс, чтобы ты мог учиться в своём
              темпе и видеть реальный прогресс.
            </p>
            <img
              src="/branding/v2/about-illustration-mobile.webp"
              alt=""
              className={styles.heroIllustration}
            />
            <div className={styles.featureRow}>
              {whyFeaturesMobile.map((item, i) => (
                <div
                  key={item.title}
                  className={styles.featureItem}
                  style={{ ['--accent' as string]: featureColors[i % featureColors.length] }}
                >
                  <span className={styles.featureIcon}>
                    <Icon name={item.icon} size={20} />
                  </span>
                  <span className={styles.featureLabel}>{item.title}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.card}>
            <p className="text-h3">Наши принципы</p>
            {principlesMobile.map((item, i) => (
              <div
                key={item.title}
                className={styles.principleRow}
                style={{ ['--accent' as string]: principleColors[i % principleColors.length] }}
              >
                <span className={styles.principleIcon}>
                  <Icon name={item.icon} size={20} />
                </span>
                <div>
                  <p className="text-body-sm" style={{ fontWeight: 700 }}>
                    {item.title}
                  </p>
                  <p className="text-body-sm text-secondary">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.card}>
            <p className="text-h3">Как это работает?</p>
            <div className={styles.stepsRow}>
              {howItWorks.map((step, i) => (
                <Fragment key={step.index}>
                  <div className={styles.stepCard} style={{ ['--accent' as string]: step.color }}>
                    <span className={styles.stepIndex}>{step.index}</span>
                    <p className="text-body-sm">{step.title}</p>
                  </div>
                  {i < howItWorks.length - 1 && (
                    <Icon name="arrowRight" size={18} className={styles.stepArrow} />
                  )}
                </Fragment>
              ))}
            </div>
          </div>

          <div className={styles.card}>
            <p className="text-h3">Частые вопросы</p>
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
                    <Icon name="question" size={18} />
                    <span className={clsx('text-body-sm', styles.faqQuestion)}>
                      {item.question}
                    </span>
                    <Icon name={open ? 'chevronUp' : 'chevronDown'} size={16} />
                  </button>
                  <Collapse open={open}>
                    <p className={clsx('text-body-sm', styles.faqAnswer)}>{item.answer}</p>
                  </Collapse>
                </div>
              );
            })}
          </div>
        </>
      )}
    </SlideUp>
  );
}
