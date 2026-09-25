import { Icon } from '../Icon/Icon.js';
import type { IconName } from '../Icon/icons.js';
import styles from './DesktopToolsCard.module.css';

const tools: { id: string; label: string; icon: IconName }[] = [
  { id: 'calculator', label: 'Калькулятор', icon: 'calculator' },
  { id: 'notes', label: 'Заметки', icon: 'notes' },
  { id: 'hint', label: 'Подсказка', icon: 'hint' },
];

/**
 * Desktop's "Инструменты" sidebar card (S1 Block 6 — desktop Training):
 * always visible (no collapse — desktop has the room mobile doesn't),
 * matching desktop/04_training.png exactly.
 */
export function DesktopToolsCard({ onSelectHint }: { onSelectHint: () => void }) {
  return (
    <div className={styles.card}>
      <p className="text-h3">Инструменты</p>
      <div className={styles.list}>
        {tools.map((tool) => (
          <button
            key={tool.id}
            type="button"
            className={styles.item}
            onClick={tool.id === 'hint' ? onSelectHint : undefined}
          >
            <span className={styles.itemIcon}>
              <Icon name={tool.icon} size={18} />
            </span>
            {tool.label}
          </button>
        ))}
      </div>
    </div>
  );
}
