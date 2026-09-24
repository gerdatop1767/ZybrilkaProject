import { useNavigation, type MainTabId } from './lib/navigation.js';
import { MobileShell } from './ui/MobileShell/MobileShell.js';
import { BottomNav } from './ui/BottomNav/BottomNav.js';
import { defaultBottomNavItems } from './ui/BottomNav/defaultItems.js';
import { Home } from './screens/Home/Home.js';
import { Training } from './screens/Training/Training.js';
import { Task } from './screens/Task/Task.js';
import { Result } from './screens/Result/Result.js';
import { ProgressScreen } from './screens/Progress/ProgressScreen.js';
import { Profile } from './screens/Profile/Profile.js';
import { Onboarding } from './screens/Onboarding/Onboarding.js';
import { BattlesComingSoon } from './screens/Battles/BattlesComingSoon.js';

/**
 * App root: reads navigation state and renders the matching screen.
 * Task/Result/Onboarding are full-screen overlays and hide the bottom
 * nav (Design Spec Section 3: "Task/battle screens hide the bottom
 * nav"); Home/Training/Battles/Progress/Profile are the persistent tabs
 * behind BottomNav.
 */
export function App() {
  const { tab, overlay, navigate } = useNavigation();

  if (overlay) {
    return (
      <MobileShell>
        {overlay.screen === 'task' && <Task taskId={overlay.taskId} />}
        {overlay.screen === 'result' && (
          <Result taskId={overlay.taskId} correct={overlay.correct} />
        )}
        {overlay.screen === 'onboarding' && <Onboarding />}
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
      {tab === 'home' && <Home />}
      {tab === 'training' && <Training />}
      {tab === 'battles' && <BattlesComingSoon />}
      {tab === 'progress' && <ProgressScreen />}
      {tab === 'profile' && <Profile />}
    </MobileShell>
  );
}
