import { useEffect } from 'react';
import { useNavigation } from './lib/navigation.js';
import { useIsDesktop } from './lib/useIsDesktop.js';
import { useToast } from './ui/Toast/ToastProvider.js';
import { AppMobile } from './AppMobile.js';
import { AppDesktop } from './AppDesktop.js';

/**
 * App root (S1 Block 6, approved design): desktop and mobile are
 * separate compositions, so this just decides which tree mounts —
 * `AppMobile` / `AppDesktop` own everything else.
 */
export function App() {
  const { tab, overlay } = useNavigation();
  const { clear } = useToast();
  const isDesktop = useIsDesktop();

  // A toast from the previous screen renders in the same top-of-screen
  // spot as an overlay's back button — never let it survive a
  // navigation and cover the new screen's controls.
  useEffect(() => {
    clear();
  }, [tab, overlay, clear]);

  return isDesktop ? <AppDesktop /> : <AppMobile />;
}
