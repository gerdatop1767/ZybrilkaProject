import { DesktopShell } from './ui/DesktopShell/DesktopShell.js';
import { WipPlaceholder } from './ui/WipPlaceholder/WipPlaceholder.js';
import { TaskDesktop } from './screens/Task/TaskDesktop.js';
import { ResultDesktop } from './screens/Result/ResultDesktop.js';
import { useNavigation } from './lib/navigation.js';
import { HomeDesktop } from './screens/Home/HomeDesktop.js';

/** Screens whose approved desktop composition has no left sidebar. */
const noSidebarScreens = new Set(['home', 'subjectCatalog', 'task', 'result']);

/**
 * Desktop app tree (S1 Block 6, approved design) — its own composition,
 * not mobile scaled up. Screens not yet rebuilt render a plain
 * placeholder rather than the old design.
 */
export function AppDesktop() {
  const { tab, overlay } = useNavigation();

  if (overlay) {
    const sidebar = !noSidebarScreens.has(overlay.screen);
    const header = overlay.screen === 'subjectCatalog' ? 'cta' : 'status';
    return (
      <DesktopShell header={header} sidebar={sidebar}>
        {overlay.screen === 'menu' && (
          <WipPlaceholder
            title="Меню"
            note="Утверждённый референс для десктоп-меню ещё не получен."
          />
        )}
        {overlay.screen === 'subjectCatalog' && (
          <WipPlaceholder title="Предметы" note="Экран в разработке — следующий блок." />
        )}
        {overlay.screen === 'subject' && (
          <WipPlaceholder title="Предмет" note="Экран в разработке — следующий блок." />
        )}
        {overlay.screen === 'task' && (
          <TaskDesktop
            subjectId={overlay.subjectId}
            taskNumber={overlay.taskNumber}
            taskId={overlay.taskId}
          />
        )}
        {overlay.screen === 'result' && (
          <ResultDesktop
            subjectId={overlay.subjectId}
            taskNumber={overlay.taskNumber}
            taskId={overlay.taskId}
            correct={overlay.correct}
            userAnswer={overlay.userAnswer}
          />
        )}
        {overlay.screen === 'mistakes' && (
          <WipPlaceholder title="Мои ошибки" note="Экран в разработке — следующий блок." />
        )}
        {overlay.screen === 'rating' && (
          <WipPlaceholder title="Рейтинг" note="Экран в разработке — следующий блок." />
        )}
        {overlay.screen === 'about' && (
          <WipPlaceholder title="О проекте" note="Экран в разработке — следующий блок." />
        )}
        {overlay.screen === 'learningCenter' && (
          <WipPlaceholder
            title="Учебный центр"
            note="Утверждённый референс для этого экрана ещё не получен."
          />
        )}
        {overlay.screen === 'onboarding' && (
          <WipPlaceholder title="Онбординг" note="Экран в разработке — следующий блок." />
        )}
      </DesktopShell>
    );
  }

  const sidebar = !noSidebarScreens.has(tab);
  const header = tab === 'home' ? 'cta' : 'status';

  return (
    <DesktopShell header={header} sidebar={sidebar}>
      {tab === 'home' && <HomeDesktop />}
      {tab === 'training' && (
        <WipPlaceholder title="Тренировка" note="Экран в разработке — следующий блок." />
      )}
      {tab === 'statistics' && (
        <WipPlaceholder title="Статистика" note="Экран в разработке — следующий блок." />
      )}
      {tab === 'achievements' && (
        <WipPlaceholder title="Достижения" note="Экран в разработке — следующий блок." />
      )}
      {tab === 'profile' && (
        <WipPlaceholder title="Профиль" note="Экран в разработке — следующий блок." />
      )}
    </DesktopShell>
  );
}
