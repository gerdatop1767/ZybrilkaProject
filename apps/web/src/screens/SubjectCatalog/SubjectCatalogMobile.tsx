import { useNavigation } from '../../lib/navigation.js';
import { subjects } from '../../data/subjects.js';
import { Icon } from '../../ui/Icon/Icon.js';
import { FadeIn, SlideUp } from '../../ui/motion/motion.js';
import styles from './SubjectCatalogMobile.module.css';

const totalTasks = subjects.reduce((sum, subject) => sum + subject.taskCount, 0);

const stats = [
  {
    image: '/branding/v2/summary/subjects.png',
    label: 'предметов',
    value: `${subjects.length}`,
  },
  {
    image: '/branding/v2/summary/tasks.png',
    label: 'заданий',
    value: `${totalTasks.toLocaleString('ru-RU')}+`,
  },
  {
    image: '/branding/v2/summary/full-statistics.png',
    label: 'статистика',
    value: 'Полная',
  },
] as const;

/**
 * Mobile "Предметы" — the same 9 subjects, task counts and summary
 * cards as SubjectCatalogDesktop, restacked into a single scrollable
 * column: no approved mobile screenshot exists for this screen, so
 * it stays a functional, same-visual-language adaptation of the
 * desktop page rather than an invented composition.
 */
export function SubjectCatalogMobile() {
  const { navigate, back } = useNavigation();

  return (
    <SlideUp className={styles.stack}>
      <div className={styles.header}>
        <button type="button" className={styles.backButton} aria-label="Назад" onClick={back}>
          <Icon name="back" size={20} />
        </button>
        <p className="text-body" style={{ fontWeight: 700 }}>
          Предметы
        </p>
      </div>

      <p className="text-body-sm text-secondary">Выбери предмет и начни готовиться к ЕГЭ</p>

      <div className={styles.statsRow}>
        {stats.map((stat, index) => (
          <FadeIn key={stat.label} delayMs={index * 40} className={styles.statCard}>
            <img src={stat.image} alt="" aria-hidden="true" className={styles.statIcon} />
            <span className="text-body" style={{ fontWeight: 700 }}>
              {stat.value}
            </span>
            <span className="text-label text-secondary">{stat.label}</span>
          </FadeIn>
        ))}
      </div>

      <div className={styles.list}>
        {subjects.map((subject, index) => (
          <FadeIn key={subject.id} delayMs={index * 30}>
            <button
              type="button"
              className={styles.subjectRow}
              style={{ ['--subject-accent' as string]: subject.color }}
              onClick={() =>
                navigate({ screen: 'subject', subjectId: subject.id, from: 'subjectCatalog' })
              }
            >
              <span className={styles.subjectThumb}>
                <img
                  src={`/branding/v2/subjects/${subject.id}.png`}
                  alt=""
                  aria-hidden="true"
                  className={styles.subjectThumbImg}
                  loading="lazy"
                />
              </span>
              <span className={styles.subjectBody}>
                <span className="text-body" style={{ fontWeight: 700 }}>
                  {subject.shortName}
                </span>
                <span className="text-body-sm text-secondary">
                  {subject.taskCount.toLocaleString('ru-RU')} заданий
                </span>
              </span>
              <span className={styles.subjectArrow} style={{ background: subject.color }}>
                <Icon name="arrowRight" size={16} />
              </span>
            </button>
          </FadeIn>
        ))}
      </div>
    </SlideUp>
  );
}
