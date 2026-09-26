import { DesktopShell } from './ui/DesktopShell/DesktopShell.js';
import { WipPlaceholder } from './ui/WipPlaceholder/WipPlaceholder.js';
import { TaskDesktop } from './screens/Task/TaskDesktop.js';
import { ResultDesktop } from './screens/Result/ResultDesktop.js';
import { useNavigation } from './lib/navigation.js';
import { HomeDesktop } from './screens/Home/HomeDesktop.js';
import { StatisticsDesktop } from './screens/Statistics/StatisticsDesktop.js';
import { MistakesDesktop } from './screens/Mistakes/MistakesDesktop.js';
import { AchievementsDesktop } from './screens/Achievements/AchievementsDesktop.js';
import { RatingDesktop } from './screens/Rating/RatingDesktop.js';
import { AboutDesktop } from './screens/About/AboutDesktop.js';
import { LearningCenterDesktop } from './screens/LearningCenter/LearningCenterDesktop.js';
import { SubjectCatalogDesktop } from './screens/SubjectCatalog/SubjectCatalogDesktop.js';

/** Screens whose approved desktop composition has no left sidebar. */
const noSidebarScreens = new Set(['home', 'task', 'result']);

/**
 * Desktop app tree (S1 Block 6, approved design) — its own composition,
 * not mobile scaled up. Screens not yet rebuilt render a plain
 * placeholder rather than the old design.
 */
export function AppDesktop() {
  const { tab, overlay } = useNavigation();

  if (overlay) {
    const sidebar = !noSidebarScreens.has(overlay.screen);
    const header = 'status';
    return (
      <DesktopShell header={header} sidebar={sidebar}>
        {overlay.screen === 'menu' && (
          <WipPlaceholder
            title="Меню"
            note="Утверждённый референс для десктоп-меню ещё не получен."
          />
        )}
        {overlay.screen === 'subjectCatalog' && <SubjectCatalogDesktop />}
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
        {overlay.screen === 'mistakes' && <MistakesDesktop />}
        {overlay.screen === 'rating' && <RatingDesktop />}
        {overlay.screen === 'about' && <AboutDesktop />}
        {overlay.screen === 'learningCenter' && <LearningCenterDesktop />}
        {overlay.screen === 'onboarding' && (
          <WipPlaceholder title="Онбординг" note="Экран в разработке — следующий блок." />
        )}
        {overlay.screen === 'favorites' && (
          <WipPlaceholder title="Избранное" note="Экран в разработке — следующий блок." />
        )}
        {overlay.screen === 'mockExams' && (
          <WipPlaceholder title="Пробники" note="Экран в разработке — следующий блок." />
        )}
        {overlay.screen === 'topics' && (
          <WipPlaceholder title="Темы" note="Экран в разработке — следующий блок." />
        )}
        {overlay.screen === 'friends' && (
          <WipPlaceholder title="Друзья" note="Экран в разработке — следующий блок." />
        )}
        {overlay.screen === 'settings' && (
          <WipPlaceholder title="Настройки" note="Экран в разработке — следующий блок." />
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
      {tab === 'statistics' && <StatisticsDesktop />}
      {tab === 'achievements' && <AchievementsDesktop />}
      {tab === 'profile' && (
        <WipPlaceholder title="Профиль" note="Экран в разработке — следующий блок." />
      )}
    </DesktopShell>
  );
}
