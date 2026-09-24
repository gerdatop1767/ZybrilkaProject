import { useState } from 'react';
import { MobileShell } from './ui/MobileShell/MobileShell.js';
import { BottomNav } from './ui/BottomNav/BottomNav.js';
import { defaultBottomNavItems } from './ui/BottomNav/defaultItems.js';
import { Button } from './ui/Button/Button.js';
import { Card } from './ui/Card/Card.js';
import { Icon } from './ui/Icon/Icon.js';
import { Input } from './ui/Input/Input.js';
import { Select } from './ui/Select/Select.js';
import { Tabs } from './ui/Tabs/Tabs.js';
import { Chip } from './ui/Chip/Chip.js';
import { Modal } from './ui/Modal/Modal.js';
import { BottomSheet } from './ui/BottomSheet/BottomSheet.js';
import { useToast } from './ui/Toast/ToastProvider.js';
import { ProgressBar } from './ui/Progress/ProgressBar.js';
import { CircularProgress } from './ui/Progress/CircularProgress.js';
import { FeedbackState } from './ui/FeedbackState/FeedbackState.js';
import { SkeletonTask } from './ui/Skeleton/Skeleton.js';
import { FadeIn } from './ui/motion/motion.js';
import styles from './App.module.css';

const subjectOptions = [
  { value: 'math', label: 'Математика' },
  { value: 'russian', label: 'Русский язык' },
  { value: 'physics', label: 'Физика' },
];

const trainingTabs = [
  { id: 'topic', label: 'По теме' },
  { id: 'mistakes', label: 'Мои ошибки' },
  { id: 'smart', label: 'Умная' },
];

/**
 * S1 foundation preview.
 *
 * This is NOT a real screen — it exists only to prove the design
 * tokens and reusable components (Block 1: Button/Card/Icon/layout/nav;
 * Block 2: Input/Select/Tabs/Chip/Modal/BottomSheet/Toast/Progress/
 * FeedbackState/Skeleton/motion) work together. Home/Training/Result/
 * etc. screens, routing and the Telegram adapter are later S1 blocks.
 */
export function App() {
  const [activeId, setActiveId] = useState('home');
  const [subject, setSubject] = useState<string | null>(null);
  const [tab, setTab] = useState('topic');
  const [modalOpen, setModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedChip, setSelectedChip] = useState('math');
  const { show } = useToast();

  return (
    <MobileShell
      nav={<BottomNav items={defaultBottomNavItems} activeId={activeId} onSelect={setActiveId} />}
    >
      <div className={styles.stack}>
        <h1 className="text-h1">Zybrilka</h1>
        <p className="text-body text-secondary">
          Тренажёр для ЕГЭ — фундамент интерфейса (S1, блок 2)
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

        <Card className={styles.stack}>
          <p className="text-h3">Поля ввода</p>
          <Input label="Ответ" placeholder="Введите число" />
          <Select label="Предмет" options={subjectOptions} value={subject} onChange={setSubject} />
        </Card>

        <Card className={styles.stack}>
          <p className="text-h3">Вкладки и фильтры</p>
          <Tabs
            items={trainingTabs}
            activeId={tab}
            onChange={setTab}
            aria-label="Режим тренировки"
          />
          <div className={styles.row}>
            <Chip
              selected={selectedChip === 'math'}
              accentColor="var(--color-subject-math)"
              onClick={() => setSelectedChip('math')}
            >
              Математика
            </Chip>
            <Chip
              selected={selectedChip === 'physics'}
              accentColor="var(--color-subject-physics)"
              onClick={() => setSelectedChip('physics')}
            >
              Физика
            </Chip>
          </div>
        </Card>

        <Card className={styles.stack}>
          <p className="text-h3">Прогресс</p>
          <ProgressBar value={64} label="Точность" />
          <div className={styles.row}>
            <CircularProgress value={82} label="Производные">
              82%
            </CircularProgress>
            <CircularProgress indeterminate label="Загрузка" />
          </div>
        </Card>

        <Card className={styles.stack}>
          <p className="text-h3">Состояния результата</p>
          <FadeIn>
            <FeedbackState variant="success" title="Правильно!" description="+15 XP" />
          </FadeIn>
          <FeedbackState
            variant="error"
            title="Неверно"
            description="Правильный ответ: 100. Попробуй похожую задачу."
          />
        </Card>

        <Card className={styles.stack}>
          <p className="text-h3">Загрузка</p>
          <SkeletonTask />
        </Card>

        <Card className={styles.row}>
          <Button variant="secondary" onClick={() => setModalOpen(true)}>
            Открыть модальное окно
          </Button>
          <Button variant="secondary" onClick={() => setSheetOpen(true)}>
            Открыть нижний лист
          </Button>
        </Card>

        <Card>
          <Button
            variant="primary"
            fullWidth
            onClick={() => show({ variant: 'success', message: 'Правильно!' })}
          >
            Показать уведомление
          </Button>
        </Card>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Удалить задачу?">
        <p className="text-body text-secondary">Это действие нельзя отменить.</p>
      </Modal>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Расширить поле">
        <p className="text-body text-secondary">Здесь появится математический черновик.</p>
      </BottomSheet>
    </MobileShell>
  );
}
