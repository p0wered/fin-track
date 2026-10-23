import { useEffect, useRef, useState } from 'react';

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export function useAnimatedNumber(target: number, duration = 500) {
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);
  const frameRef = useRef(0);

  useEffect(() => {
    const from = prevRef.current;
    if (from === target) {
      prevRef.current = target;
      return;
    }

    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setDisplay(Math.round(from + (target - from) * easeOutCubic(t)));
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        prevRef.current = target;
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return display;
}
