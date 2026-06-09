import { useState, useEffect } from "react";

export function useCountUp(target: number, duration = 1000, active = true) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active || target === 0) { setValue(target); return; }
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, active]);

  return value;
}
