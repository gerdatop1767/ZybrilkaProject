import { useEffect, useRef } from 'react';
import { getLearningProfile } from './lib/api.js';
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
  const { tab, overlay, navigate } = useNavigation();
  const { clear } = useToast();
  const isDesktop = useIsDesktop();

  // A toast from the previous screen renders in the same top-of-screen
  // spot as an overlay's back button — never let it survive a
  // navigation and cover the new screen's controls.
  useEffect(() => {
    clear();
  }, [tab, overlay, clear]);

  // First-login gate (DB is the source of truth, never localStorage —
  // see apps/api's learningProfile module): only redirects when the
  // user landed on a plain tab with no overlay/deep link already open,
  // so a direct task/result link is never interrupted.
  const checkedOnboarding = useRef(false);
  useEffect(() => {
    if (checkedOnboarding.current || overlay !== null) return;
    checkedOnboarding.current = true;
    getLearningProfile()
      .then((profile) => {
        if (!profile.onboardingCompleted) {
          navigate({ screen: 'onboarding' });
        }
      })
      .catch(() => {
        // No DB / offline — fall through to the normal app rather than
        // blocking on a profile check that can't succeed.
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlay]);

  return isDesktop ? <AppDesktop /> : <AppMobile />;
}
