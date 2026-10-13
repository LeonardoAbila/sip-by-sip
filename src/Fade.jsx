import React, { useEffect, useRef, useState } from 'react';

// Keep content mounted briefly so its exit fade finishes before removal.
export default function Fade({ visible, children }) {
  const [present, setPresent] = useState(visible);
  const lastContent = useRef(children);
  if (visible) lastContent.current = children;

  useEffect(() => {
    if (visible) {
      setPresent(true);
      return;
    }
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = setTimeout(() => setPresent(false), reducedMotion ? 0 : 240);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible && !present) return null;
  const content = visible ? children : lastContent.current;
  const fadeProps = typeof content.type === 'string' ? { inert: !visible } : { fadingOut: !visible };
  return (
    <div className="fade-shell" data-visible={visible} inert={!visible}>
      {React.cloneElement(content, fadeProps)}
    </div>
  );
}
