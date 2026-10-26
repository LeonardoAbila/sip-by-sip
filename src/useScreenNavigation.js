import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

// Old History links now open the combined dashboard.
function currentScreen() {
  return window.location.hash === '#benefits' ? 'benefits' : 'home';
}

export default function useScreenNavigation() {
  const [screen, setScreen] = useState(currentScreen);
  const contentRef = useRef(null);
  const activeScreen = useRef(screen);
  const transition = useRef(null);

  useEffect(() => {
    function navigate() {
      const next = currentScreen();
      if (next === activeScreen.current) return;
      activeScreen.current = next;
      transition.current?.skipTransition();
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!reduced && typeof document.startViewTransition === 'function') {
        transition.current = document.startViewTransition(() => {
          flushSync(() => setScreen(next));
        });
        // Rapid navigation may skip an animation; the destination still updates.
        transition.current.ready.catch(() => {});
        transition.current.finished.catch(() => {});
      } else {
        setScreen(next);
      }
    }
    window.addEventListener('hashchange', navigate);
    return () => {
      window.removeEventListener('hashchange', navigate);
      transition.current?.skipTransition();
    };
  }, []);

  useEffect(() => {
    if (typeof document.startViewTransition === 'function'
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const animation = contentRef.current?.animate?.([
      { opacity: 0, transform: 'translateY(12px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ], { duration: 360, easing: 'cubic-bezier(.22, 1, .36, 1)' });
    return () => animation?.cancel();
  }, [screen]);

  return { screen, contentRef };
}
