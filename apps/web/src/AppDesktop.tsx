import { DesktopShell } from './ui/DesktopShell/DesktopShell.js';
import { WipPlaceholder } from './ui/WipPlaceholder/WipPlaceholder.js';
import { useNavigation } from './lib/navigation.js';
import { HomeDesktop } from './screens/Home/HomeDesktop.js';

/**
 * Desktop app tree (S1 Block 6, approved design) — its own composition,
 * not mobile scaled up. Home/Subject-catalog use the marketing top-bar
 * shell; everything else uses the sidebar shell. Screens not yet
 * rebuilt render a plain placeholder rather than the old design.
 */
export function AppDesktop() {
  const { tab, overlay } = useNavigation();

  if (overlay) {
    const isMarketing = overlay.screen === 'subjectCatalog';
    return (
      <DesktopShell variant={isMarketing ? 'marketing' : 'app'}>
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
          <WipPlaceholder title="Тренировка" note="Экран в разработке — следующий блок." />
        )}
        {overlay.screen === 'result' && (
          <WipPlaceholder title="Результат" note="Экран в разработке — следующий блок." />
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

  const isMarketingTab = tab === 'home';

  return (
    <DesktopShell variant={isMarketingTab ? 'marketing' : 'app'}>
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
