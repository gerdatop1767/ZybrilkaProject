/**
 * "О проекте" content (S1 Block 6, approved design — desktop/mobile
 * 11_about.png). Static product copy, taken verbatim from the
 * approved screenshots — kept out of the screen JSX so the two
 * platform layouts read from one source instead of duplicating text.
 */
import type { IconName } from '../ui/Icon/icons.js';

export interface AboutFeature {
  icon: IconName;
  title: string;
  description: string;
}

/** Mobile's 4 icons under the hero (own labels — shorter than desktop's). */
export const whyFeaturesMobile: readonly AboutFeature[] = [
  { icon: 'target', title: 'Актуальные задания', description: '' },
  { icon: 'brain', title: 'Подробные решения', description: '' },
  { icon: 'progress', title: 'Аналитика прогресса', description: '' },
  { icon: 'achievements', title: 'Геймификация и мотивация', description: '' },
];

/** Desktop "Почему Zybrilka?" grid. */
export const whyFeatures: readonly AboutFeature[] = [
  {
    icon: 'graduation',
    title: 'Актуальные задания',
    description: 'Только задания из реальных вариантов ФИПИ',
  },
  {
    icon: 'play',
    title: 'Подробные объяснения',
    description: 'Пошаговые решения и понятные разборы',
  },
  {
    icon: 'progress',
    title: 'Удобная статистика',
    description: 'Следи за прогрессом и улучшай результаты',
  },
  {
    icon: 'gem',
    title: 'Полностью бесплатно',
    description: 'Все основные функции доступны без подписки',
  },
];

/** Desktop "Наши принципы" (4 cards). */
export const principlesDesktop: readonly AboutFeature[] = [
  { icon: 'target', title: 'Качество', description: 'Только проверенные и актуальные задания' },
  { icon: 'community', title: 'Доступность', description: 'Бесплатный доступ к основным функциям' },
  { icon: 'hint', title: 'Простота', description: 'Удобный и понятный интерфейс' },
  { icon: 'favorite', title: 'Результат', description: 'Помогаем достигать высоких баллов' },
];

/** Mobile "Наши принципы" (3 rows — the mobile screenshot lists three, not four). */
export const principlesMobile: readonly AboutFeature[] = [
  {
    icon: 'xp',
    title: 'Бесплатный доступ',
    description: 'Все основные функции доступны без подписки',
  },
  {
    icon: 'graduation',
    title: 'Качество контента',
    description: 'Только актуальные и проверенные задания',
  },
  {
    icon: 'favorite',
    title: 'Удобство и мотивация',
    description: 'Приятный интерфейс и игровые элементы',
  },
];

export interface AboutStat {
  icon: IconName;
  value: string;
  label: string;
  color: string;
}

/** Desktop "Zybrilka в цифрах". */
export const aboutStats: readonly AboutStat[] = [
  {
    icon: 'topic',
    value: '12 000+',
    label: 'заданий в базе',
    color: 'var(--color-accent-primary-end)',
  },
  {
    icon: 'community',
    value: '2 500+',
    label: 'активных пользователей',
    color: 'var(--color-success)',
  },
  { icon: 'star', value: '4.9', label: 'средняя оценка', color: 'var(--color-gold)' },
  { icon: 'time', value: '2024', label: 'год запуска', color: 'var(--color-accent-secondary)' },
];

export interface AboutGoal {
  index: number;
  title: string;
  description: string;
  color: string;
}

/** Desktop "Наши цели". */
export const aboutGoals: readonly AboutGoal[] = [
  {
    index: 1,
    title: 'Добавить больше заданий',
    description: 'Расширяем базу заданий по всем предметам',
    color: 'var(--chart-1)',
  },
  {
    index: 2,
    title: 'Новые функции',
    description: 'Дополнительные инструменты для подготовки',
    color: 'var(--chart-6)',
  },
  {
    index: 3,
    title: 'Развитие сообщества',
    description: 'Делать обучение ещё интереснее и эффективнее',
    color: 'var(--color-success)',
  },
];

/** Mobile "Как это работает?" (4 numbered steps). */
export const howItWorks: readonly AboutGoal[] = [
  { index: 1, title: 'Выбираешь предмет и задание', description: '', color: 'var(--chart-1)' },
  { index: 2, title: 'Решаешь и получаешь пояснения', description: '', color: 'var(--chart-6)' },
  {
    index: 3,
    title: 'Видишь свою статистику и прогресс',
    description: '',
    color: 'var(--color-success)',
  },
  {
    index: 4,
    title: 'Достигаешь целей и сдаёшь ЕГЭ на высокий балл',
    description: '',
    color: 'var(--color-warning)',
  },
];

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const faqItems: readonly FaqItem[] = [
  {
    id: 'free',
    question: 'Zybrilka действительно бесплатный?',
    answer:
      'Да, все основные функции — тренировки, статистика и объяснения — полностью бесплатны и останутся такими.',
  },
  {
    id: 'source',
    question: 'Откуда берутся задания?',
    answer: 'Задания собраны из реальных вариантов ФИПИ и других официальных источников.',
  },
  {
    id: 'subjects',
    question: 'Будут ли новые предметы?',
    answer: 'Да, мы постепенно расширяем список предметов и добавляем новые задания.',
  },
  {
    id: 'support',
    question: 'Как я могу поддержать проект?',
    answer: 'Рассказывай о Zybrilka друзьям и присылай отзывы — это помогает нам развивать проект.',
  },
];
