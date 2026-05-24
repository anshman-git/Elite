import { useRef } from 'react';
import clsx from 'clsx';

export function SpotlightCard({ children, className = '', glow = 'amber' }) {
  const ref = useRef(null);

  const onMove = (event) => {
    const rect = ref.current.getBoundingClientRect();
    ref.current.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    ref.current.style.setProperty('--my', `${event.clientY - rect.top}px`);
  };

  const tint = glow === 'cyan' ? 'rgba(34,211,238,0.10)' : 'rgba(255,165,0,0.10)';

  return (
    <div ref={ref} onMouseMove={onMove} className={clsx('cmd-card group p-6', className)} style={{ '--spot': tint }}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: 'radial-gradient(420px circle at var(--mx) var(--my), var(--spot), transparent 50%)' }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
