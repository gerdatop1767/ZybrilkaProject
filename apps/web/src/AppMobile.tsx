import { MobileShell } from './ui/MobileShell/MobileShell.js';
import { BottomNav } from './ui/BottomNav/BottomNav.js';
import { defaultBottomNavItems } from './ui/BottomNav/defaultItems.js';
import { WipPlaceholder } from './ui/WipPlaceholder/WipPlaceholder.js';
import { TaskMobile } from './screens/Task/TaskMobile.js';
import { ResultMobile } from './screens/Result/ResultMobile.js';
import { useNavigation, type MainTabId } from './lib/navigation.js';
import { HomeMobile } from './screens/Home/HomeMobile.js';
import { StatisticsMobile } from './screens/Statistics/StatisticsMobile.js';
import { MistakesMobile } from './screens/Mistakes/MistakesMobile.js';
import { AchievementsMobile } from './screens/Achievements/AchievementsMobile.js';
import { RatingMobile } from './screens/Rating/RatingMobile.js';
import { AboutMobile } from './screens/About/AboutMobile.js';
import { sampleTask } from './data/sampleTask.js';

/**
 * Mobile app tree (S1 Block 6, approved design). Screens not yet
 * rebuilt against the approved mobile screenshots render a plain
 * "not built yet" placeholder rather than the old orange-system
 * screens, which visually contradict the new design — see the
 * project report for which screens are still pending.
 */
export function AppMobile() {
  const { tab, overlay, navigate } = useNavigation();

  function selectTab(id: string) {
    // The approved screenshots have no idle "Тренировка" tab screen —
    // tapping it jumps straight into the active training session, the
    // same real shortcut Home's own CTA uses.
    if (id === 'training') {
      navigate({
        screen: 'task',
        subjectId: sampleTask.subjectId,
        taskNumber: sampleTask.number,
        taskId: sampleTask.id,
      });
      return;
    }
    navigate({ screen: id as MainTabId });
  }

  if (overlay) {
    return (
      <MobileShell>
        {overlay.screen === 'menu' && (
          <WipPlaceholder title="Меню" note="Экран в разработке — следующий блок." />
        )}
        {overlay.screen === 'subjectCatalog' && (
          <WipPlaceholder title="Предметы" note="Экран в разработке — следующий блок." />
        )}
        {overlay.screen === 'subject' && (
          <WipPlaceholder title="Предмет" note="Экран в разработке — следующий блок." />
        )}
        {overlay.screen === 'task' && (
          <TaskMobile
            subjectId={overlay.subjectId}
            taskNumber={overlay.taskNumber}
            taskId={overlay.taskId}
          />
        )}
        {overlay.screen === 'result' && (
          <ResultMobile
            subjectId={overlay.subjectId}
            taskNumber={overlay.taskNumber}
            taskId={overlay.taskId}
            correct={overlay.correct}
            userAnswer={overlay.userAnswer}
          />
        )}
        {overlay.screen === 'mistakes' && <MistakesMobile />}
        {overlay.screen === 'rating' && <RatingMobile />}
        {overlay.screen === 'about' && <AboutMobile />}
        {overlay.screen === 'learningCenter' && (
          <WipPlaceholder
            title="Учебный центр"
            note="Утверждённый референс для этого экрана ещё не получен."
          />
        )}
        {overlay.screen === 'onboarding' && (
          <WipPlaceholder title="Онбординг" note="Экран в разработке — следующий блок." />
        )}
      </MobileShell>
    );
  }

  return (
    <MobileShell
      nav={<BottomNav items={defaultBottomNavItems} activeId={tab} onSelect={selectTab} />}
    >
      {tab === 'home' && <HomeMobile />}
      {tab === 'training' && (
        <WipPlaceholder title="Тренировка" note="Экран в разработке — следующий блок." />
      )}
      {tab === 'statistics' && <StatisticsMobile />}
      {tab === 'achievements' && <AchievementsMobile />}
      {tab === 'profile' && (
        <WipPlaceholder title="Профиль" note="Экран в разработке — следующий блок." />
      )}
    </MobileShell>
  );
}
