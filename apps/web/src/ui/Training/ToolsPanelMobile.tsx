import { Icon } from '../Icon/Icon.js';
import type { IconName } from '../Icon/icons.js';
import { Collapse } from '../motion/motion.js';
import { clsx } from '../../lib/clsx.js';
import styles from './ToolsPanelMobile.module.css';

const tools: { id: string; label: string; icon: IconName }[] = [
  { id: 'calculator', label: 'Кальк.', icon: 'calculator' },
  { id: 'canvas', label: 'Полотно', icon: 'scratchboard' },
  { id: 'input', label: 'Ввод', icon: 'fxInput' },
  { id: 'templates', label: 'Шаблоны', icon: 'templates' },
  { id: 'reference', label: 'Справочник', icon: 'reference' },
];

export interface ToolsPanelMobileProps {
  open: boolean;
  onToggle: () => void;
}

/**
 * "Дополнительные инструменты" (S1 Block 6 — mobile Training). Collapsed
 * is the approved default (04b_training_tools_hidden.png); expanding
 * reveals the same 5-tool grid shown open in 04_training.png. A real
 * toggle (controlled, shared with the answer field's own chevron
 * button), not two separate hardcoded screens.
 */
export function ToolsPanelMobile({ open, onToggle }: ToolsPanelMobileProps) {
  return (
    <div className={styles.wrap}>
      <button type="button" className={styles.summary} aria-expanded={open} onClick={onToggle}>
        <Icon name="settings" size={18} className={styles.summaryIcon} />
        <span className={styles.summaryText}>
          <span className="text-body" style={{ fontWeight: 600 }}>
            Дополнительные инструменты
          </span>
          <span className="text-body-sm text-secondary">
            Калькулятор, полотно, шаблоны и другое
          </span>
        </span>
        <Icon name={open ? 'chevronUp' : 'chevronDown'} size={18} className={styles.summaryIcon} />
      </button>
      <Collapse open={open}>
        <div className={styles.grid}>
          {tools.map((tool) => (
            <button key={tool.id} type="button" className={styles.tool}>
              <Icon name={tool.icon} size={20} />
              <span className="text-label">{tool.label}</span>
            </button>
          ))}
        </div>
      </Collapse>
    </div>
  );
}

export interface AnswerFieldToolsProps {
  fxOpen: boolean;
  onToggleFx: () => void;
  onFocusInput: () => void;
  toolsOpen: boolean;
  onToggleTools: () => void;
}

/** The compact tool buttons directly in the answer field row. */
export function AnswerFieldTools({
  fxOpen,
  onToggleFx,
  onFocusInput,
  toolsOpen,
  onToggleTools,
}: AnswerFieldToolsProps) {
  return (
    <>
      <button
        type="button"
        className={styles.fieldIconButton}
        aria-label="Клавиатура"
        onClick={onFocusInput}
      >
        <Icon name="keyboard" size={18} />
      </button>
      <button
        type="button"
        className={clsx(styles.fieldIconButton, styles.fxButton, fxOpen && styles.fxButtonActive)}
        aria-pressed={fxOpen}
        aria-label="Математические символы"
        onClick={onToggleFx}
      >
        <Icon name="fxInput" size={18} />
      </button>
      <button
        type="button"
        className={styles.fieldIconButton}
        aria-expanded={toolsOpen}
        aria-label="Показать дополнительные инструменты"
        onClick={onToggleTools}
      >
        <Icon name={toolsOpen ? 'chevronUp' : 'chevronDown'} size={18} />
      </button>
    </>
  );
}
