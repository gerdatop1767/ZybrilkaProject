import { useState } from 'react';
import { MobileShell } from './ui/MobileShell/MobileShell.js';
import { BottomNav } from './ui/BottomNav/BottomNav.js';
import { defaultBottomNavItems } from './ui/BottomNav/defaultItems.js';
import { Button } from './ui/Button/Button.js';
import { Card } from './ui/Card/Card.js';
import { Icon } from './ui/Icon/Icon.js';
import styles from './App.module.css';

/**
 * S1 foundation preview.
 *
 * This is NOT a real screen — it exists only to prove the design
 * tokens, base components (Button, Card, Icon) and layout (MobileShell,
 * BottomNav) work together. Home/Training/Result/etc. screens, routing
 * and the Telegram adapter are later S1 blocks.
 */
export function App() {
  const [activeId, setActiveId] = useState('home');

  return (
    <MobileShell
      nav={<BottomNav items={defaultBottomNavItems} activeId={activeId} onSelect={setActiveId} />}
    >
      <div className={styles.stack}>
        <h1 className="text-h1">Zybrilka</h1>
        <p className="text-body text-secondary">
          Тренажёр для ЕГЭ — фундамент интерфейса (S1, блок 1)
        </p>

        <Card>
          <p className="text-h3">Базовые компоненты</p>
          <div className={styles.row}>
            <Button variant="primary">Начать тренировку</Button>
          </div>
          <div className={styles.row}>
            <Button variant="secondary">Подробнее</Button>
            <Button variant="ghost">Похожая задача</Button>
          </div>
          <div className={styles.row}>
            <Button variant="destructive">Удалить</Button>
            <Button variant="primary" disabled>
              Недоступно
            </Button>
            <Button variant="primary" loading>
              Загрузка
            </Button>
          </div>
        </Card>

        <Card elevated>
          <p className="text-h3">Иконки</p>
          <div className={styles.iconRow}>
            <Icon name="flame" />
            <Icon name="xp" />
            <Icon name="star" />
            <Icon name="target" />
            <Icon name="check" />
            <Icon name="lock" />
            <Icon name="home" filled />
          </div>
        </Card>

        <Card>
          <p className="text-h3">Статистика</p>
          <p className="text-stat">642 / 1000 XP</p>
        </Card>
      </div>
    </MobileShell>
  );
}
