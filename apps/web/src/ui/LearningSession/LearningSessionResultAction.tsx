import { useState } from 'react';
import { useNavigation } from '../../lib/navigation.js';
import { getLearningSessionNext } from '../../lib/api.js';
import {
  applyLearningSessionResponse,
  useLearningSessionContext,
  type LearningSessionState,
} from '../../lib/learningSessionContext.js';
import { Button } from '../Button/Button.js';
import { Icon } from '../Icon/Icon.js';

/**
 * ZUBRILKA LEARNING INTELLIGENCE, Phase 10 — the only Result addition
 * for a real backend learning session: an extra action that calls
 * `GET /me/learning/sessions/:id/next` (only reachable from here, i.e.
 * only after the real attempt behind this Result screen already
 * happened — see Phase 9/10's "next only after a real submission"
 * rule) and hands the response to the same `applyLearningSessionResponse`
 * Training/LearningSession use, so an active response lands on the next
 * task and a completed one lands on the summary — never re-derived
 * here. This never touches Result's existing `goToNext()`/`taskNav`
 * button, which is unrelated sibling-task navigation.
 */
export function LearningSessionResultAction({
  session,
}: {
  session: Extract<LearningSessionState, { status: 'active' }>;
}) {
  const { navigate } = useNavigation();
  const { setSession } = useLearningSessionContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLast = session.position >= session.total;

  function handleContinue() {
    setLoading(true);
    setError(null);
    void getLearningSessionNext(session.sessionId)
      .then((response) => {
        const outcome = applyLearningSessionResponse(response, setSession, navigate);
        if (outcome === 'none') setError('Не удалось продолжить тренировку.');
      })
      .catch(() => setError('Не удалось продолжить тренировку.'))
      .finally(() => setLoading(false));
  }

  return (
    <div>
      {error && (
        <p className="text-body-sm" style={{ color: 'var(--color-error)' }}>
          {error}
        </p>
      )}
      <Button variant="primary" fullWidth loading={loading} onClick={handleContinue}>
        {isLast ? 'Завершить тренировку' : 'Следующее задание'} <Icon name="arrowRight" size={18} />
      </Button>
    </div>
  );
}
