import type { ComponentType } from 'react';
import { Concept01PremiumDark } from './Concept01PremiumDark.js';
import { Concept02BoldOrangeBlack } from './Concept02BoldOrangeBlack.js';
import { Concept03Editorial } from './Concept03Editorial.js';
import { Concept04GamifiedMature } from './Concept04GamifiedMature.js';
import { Concept05CleanPremium } from './Concept05CleanPremium.js';
import { Concept06Futuristic } from './Concept06Futuristic.js';
import { Concept07Bento } from './Concept07Bento.js';
import { Concept08SocialCompetitive } from './Concept08SocialCompetitive.js';
import { Concept09BoldGraphic } from './Concept09BoldGraphic.js';
import { Concept10Signature } from './Concept10Signature.js';

export interface ConceptEntry {
  id: string;
  number: string;
  title: string;
  description: string;
  Component: ComponentType;
}

export const concepts: readonly ConceptEntry[] = [
  {
    id: 'premium-dark',
    number: '01',
    title: 'Premium dark mobile app',
    description: 'Восстановленный контраст через пространство и вес шрифта, а не заливки.',
    Component: Concept01PremiumDark,
  },
  {
    id: 'bold-orange-black',
    number: '02',
    title: 'Bold orange/black educational',
    description: 'Плоские блоки чистого цвета, толстые чёрные обводки, максимальная энергия.',
    Component: Concept02BoldOrangeBlack,
  },
  {
    id: 'editorial',
    number: '03',
    title: 'Editorial / typography-heavy',
    description: 'Без карточек — редакционная вёрстка, крупные заголовки, линии-разделители.',
    Component: Concept03Editorial,
  },
  {
    id: 'gamified-mature',
    number: '04',
    title: 'Gamified but mature',
    description: 'Игровые метафоры (уровень, шкала опыта, медали) в сдержанной подаче.',
    Component: Concept04GamifiedMature,
  },
  {
    id: 'clean-premium',
    number: '05',
    title: 'Extremely clean premium',
    description: 'Минимум элементов на экране, огромные отступы, иерархия только через размер.',
    Component: Concept05CleanPremium,
  },
  {
    id: 'futuristic',
    number: '06',
    title: 'Futuristic education',
    description: 'Сетка-текстура, светящиеся линии, срезанные углы — сдержанный sci-fi.',
    Component: Concept06Futuristic,
  },
  {
    id: 'bento',
    number: '07',
    title: 'Modern bento',
    description: 'Разноразмерные плитки в духе iOS-виджетов вместо однородного списка карточек.',
    Component: Concept07Bento,
  },
  {
    id: 'social-competitive',
    number: '08',
    title: 'Social / competitive',
    description: 'Рейтинг, социальное доказательство, лента активности — соревновательная рамка.',
    Component: Concept08SocialCompetitive,
  },
  {
    id: 'bold-graphic',
    number: '09',
    title: 'Bold graphic / high contrast',
    description: 'Swiss-плакатная сетка, чистый чёрный/белый/оранжевый, никаких полутонов.',
    Component: Concept09BoldGraphic,
  },
  {
    id: 'signature',
    number: '10',
    title: 'Original Zybrilka signature',
    description: 'Синтез направлений — герой-баннер, editorial-типографика и bento-плитки.',
    Component: Concept10Signature,
  },
];
