import type { LearningSessionState } from '../../lib/learningSessionContext.js';
import { Chip } from '../Chip/Chip.js';

/**
 * ZUBRILKA LEARNING INTELLIGENCE, Phase 10 — the only UI Task/Result
 * add for a real backend learning session: a small, unobtrusive
 * "Тренировка · N из M" indicator built from the existing `Chip`
 * (Design Spec Section 12), never a new badge component or color.
 */
export function LearningSessionBadge({
  session,
}: {
  session: Extract<LearningSessionState, { status: 'active' }>;
}) {
  return (
    <Chip selected icon="smart">
      Тренировка · {session.position} из {session.total}
    </Chip>
  );
}
