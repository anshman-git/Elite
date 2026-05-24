import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

export function CountUp({ to, duration = 1200, prefix = '', suffix = '', className = '' }) {
  const [val, setVal] = useState(0);
  const reduced = useReducedMotion();
  const startRef = useRef(null);

  useEffect(() => {
    startRef.current = null;
    if (reduced) return undefined;

    let raf;
    const tick = (t) => {
      if (!startRef.current) startRef.current = t;
      const p = Math.min((t - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      setVal(Math.round(to * eased));
      if (p < 1) raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [to, duration, reduced]);

  const displayValue = reduced ? to : val;

  return <span className={className}>{prefix}{displayValue.toLocaleString()}{suffix}</span>;
}
