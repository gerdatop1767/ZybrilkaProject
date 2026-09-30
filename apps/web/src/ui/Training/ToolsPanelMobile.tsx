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
  /** Training's own answer field now has a pencil button that opens
   * this same panel, so it no longer needs its own permanent summary
   * row sitting in the page flow — only the collapsible tool grid
   * renders there. Result has no such trigger, so it keeps the
   * self-contained summary+chevron toggle (default). */
  hideSummary?: boolean;
  /** Called with a tool's id when its tile is tapped — only
   * 'calculator' and 'canvas' currently open something real; the rest
   * stay decorative until their own block. */
  onSelect?: (toolId: string) => void;
}

/**
 * "Дополнительные инструменты" (S1 Block 6 — mobile Training/Result).
 * On Result this is a self-contained collapsible card. On Training the
 * pencil icon next to the answer field is the only trigger
 * (`hideSummary`), so the tools never take up permanent space in the
 * page when collapsed.
 */
export function ToolsPanelMobile({ open, onToggle, hideSummary, onSelect }: ToolsPanelMobileProps) {
  const grid = (
    <div className={styles.grid}>
      {tools.map((tool) => (
        <button
          key={tool.id}
          type="button"
          className={styles.tool}
          onClick={() => onSelect?.(tool.id)}
        >
          <Icon name={tool.icon} size={20} />
          <span className="text-label">{tool.label}</span>
        </button>
      ))}
    </div>
  );

  if (hideSummary) {
    return (
      <Collapse open={open} className={styles.hiddenSummaryWrap}>
        {grid}
      </Collapse>
    );
  }

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
      <Collapse open={open}>{grid}</Collapse>
    </div>
  );
}

export interface ToolsToggleButtonProps {
  toolsOpen: boolean;
  onToggleTools: () => void;
}

/**
 * The pencil button directly in the answer field row that opens
 * "Дополнительные инструменты" below (`ToolsPanelMobile` with
 * `hideSummary`). The math-symbol ("fx") toggle that used to live
 * here moved into `MathAnswerField` itself (it now owns its own
 * keyboard panel), so this is just the one remaining button.
 */
export function ToolsToggleButton({ toolsOpen, onToggleTools }: ToolsToggleButtonProps) {
  return (
    <button
      type="button"
      className={clsx(styles.fieldIconButton, styles.fxButton, toolsOpen && styles.fxButtonActive)}
      aria-expanded={toolsOpen}
      aria-label="Дополнительные инструменты"
      onClick={onToggleTools}
    >
      <Icon name="edit" size={18} />
    </button>
  );
}
