import { useState } from 'react';
import { useNavigation } from '../../lib/navigation.js';
import { subjects } from '../../data/subjects.js';
import { Button } from '../../ui/Button/Button.js';
import { Card } from '../../ui/Card/Card.js';
import { Chip } from '../../ui/Chip/Chip.js';
import { Icon } from '../../ui/Icon/Icon.js';
import { Logo } from '../../ui/Logo/Logo.js';
import { clsx } from '../../lib/clsx.js';
import { FadeIn } from '../../ui/motion/motion.js';
import styles from './Onboarding.module.css';

const TOTAL_STEPS = 5;

interface FocusOption {
  id: string;
  label: string;
  description: string;
}

const focusOptions: readonly FocusOption[] = [
  {
    id: 'weak',
    label: 'Подтянуть слабые темы',
    description: 'Сфокусируемся на том, что пока не получается',
  },
  {
    id: 'part1',
    label: 'Первая часть ЕГЭ',
    description: 'Базовые задания без сложных доказательств',
  },
  { id: 'full', label: 'Полная подготовка', description: 'Все темы и типы заданий' },
];

/**
 * Onboarding (Design Spec Section 6): a 5-step welcome → subjects →
 * focus → diagnostic intro → result flow. UI only — no real adaptive
 * calculation or persistence, per instructions.
 */
export function Onboarding() {
  const { navigate, back } = useNavigation();
  const [step, setStep] = useState(1);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['math']);
  const [focus, setFocus] = useState<string | null>(null);

  function toggleSubject(id: string) {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  function goBack() {
    if (step === 1) {
      back();
    } else {
      setStep((s) => s - 1);
    }
  }

  return (
    <div className={styles.stack}>
      <div className={styles.header}>
        <button type="button" className={styles.backButton} onClick={goBack} aria-label="Назад">
          <Icon name="back" size={22} />
        </button>
        <div
          className={styles.stepDots}
          role="progressbar"
          aria-label="Шаг онбординга"
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={TOTAL_STEPS}
        >
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <span key={i} className={clsx(styles.stepDot, i < step && styles.stepDotDone)} />
          ))}
        </div>
      </div>

      <FadeIn key={step} className={styles.content}>
        {step === 1 && (
          <div className={styles.centered}>
            <Logo size={56} />
            <h1 className="text-h1">Добро пожаловать в Zybrilka!</h1>
            <p className="text-body text-secondary">
              Бесплатный тренажёр для подготовки к ЕГЭ. Ответим на пару вопросов и подберём
              тренировку под тебя.
            </p>
            <Button variant="primary" fullWidth onClick={() => setStep(2)}>
              Начать
            </Button>
          </div>
        )}

        {step === 2 && (
          <>
            <h1 className="text-h2">Какие предметы сдаёшь?</h1>
            <div className={styles.chipGrid}>
              {subjects.map((subject) => (
                <Chip
                  key={subject.id}
                  selected={selectedSubjects.includes(subject.id)}
                  accentColor={subject.color}
                  onClick={() => toggleSubject(subject.id)}
                >
                  {subject.shortName}
                </Chip>
              ))}
            </div>
            <Button
              variant="primary"
              fullWidth
              disabled={selectedSubjects.length === 0}
              onClick={() => setStep(3)}
            >
              Далее
            </Button>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="text-h2">На чём сфокусироваться?</h1>
            <div className={styles.optionList}>
              {focusOptions.map((option) => {
                const selected = option.id === focus;
                return (
                  <button
                    key={option.id}
                    type="button"
                    className={clsx(styles.optionCard, selected && styles.optionCardSelected)}
                    aria-pressed={selected}
                    onClick={() => setFocus(option.id)}
                  >
                    <span className={styles.optionText}>
                      <span className="text-body">{option.label}</span>
                      <span className="text-body-sm text-secondary">{option.description}</span>
                    </span>
                    {selected && (
                      <span className={styles.optionCheck}>
                        <Icon name="check" size={20} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <Button variant="primary" fullWidth disabled={!focus} onClick={() => setStep(4)}>
              Далее
            </Button>
          </>
        )}

        {step === 4 && (
          <div className={styles.centered}>
            <h1 className="text-h2">Короткая диагностика</h1>
            <p className="text-body text-secondary">
              Диагностика ещё в разработке — скоро она поможет понять твой текущий уровень по темам.
              Пока можно сразу перейти к тренировкам.
            </p>
            <Button variant="primary" fullWidth onClick={() => setStep(5)}>
              Далее
            </Button>
          </div>
        )}

        {step === 5 && (
          <>
            <div className={styles.centered}>
              <h1 className="text-h2">Почти готово!</h1>
            </div>
            <Card>
              <p className="text-body-sm text-secondary">
                Диагностика и профиль по темам появятся здесь, когда мы их реализуем. Начни
                тренироваться — прогресс будет собираться по мере решения заданий.
              </p>
            </Card>
            <Button variant="primary" fullWidth onClick={() => navigate({ screen: 'home' })}>
              Перейти к тренировкам
            </Button>
          </>
        )}
      </FadeIn>
    </div>
  );
}
