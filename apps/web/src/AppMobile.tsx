import { MobileShell } from './ui/MobileShell/MobileShell.js';
import { BottomNav } from './ui/BottomNav/BottomNav.js';
import { defaultBottomNavItems } from './ui/BottomNav/defaultItems.js';
import { WipPlaceholder } from './ui/WipPlaceholder/WipPlaceholder.js';
import { useNavigation, type MainTabId } from './lib/navigation.js';
import { HomeMobile } from './screens/Home/HomeMobile.js';

/**
 * Mobile app tree (S1 Block 6, approved design). Screens not yet
 * rebuilt against the approved mobile screenshots render a plain
 * "not built yet" placeholder rather than the old orange-system
 * screens, which visually contradict the new design — see the
 * project report for which screens are still pending.
 */
export function AppMobile() {
  const { tab, overlay, navigate } = useNavigation();

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
      </MobileShell>
    );
  }

  return (
    <MobileShell
      nav={
        <BottomNav
          items={defaultBottomNavItems}
          activeId={tab}
          onSelect={(id) => navigate({ screen: id as MainTabId })}
        />
      }
    >
      {tab === 'home' && <HomeMobile />}
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
    </MobileShell>
  );
}
