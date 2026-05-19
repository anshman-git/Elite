import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { watchCollection } from '../firebase';

export default function AnnouncementTicker({ announcements = null }) {
  const containerRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const [liveAnnouncements, setLiveAnnouncements] = useState([]);

  useEffect(() => {
    if (announcements) return () => {};
    return watchCollection('announcements', setLiveAnnouncements, {
      take: 2,
      onError: (error) => console.error('Could not load ticker announcements:', error),
    });
  }, [announcements]);

  const items = useMemo(() => {
    if (announcements) return announcements;
    if (liveAnnouncements.length > 0) {
      return liveAnnouncements
        .slice(0, 2)
        .map((item) => item.tickerText || item.title || item.body)
        .filter(Boolean);
    }
    return ['Weekly Quiz Live', 'Leaderboard Rewards'];
  }, [announcements, liveAnnouncements]);

  const loopItems = [...items, ...items, ...items, ...items];

  return (
    <div
      ref={containerRef}
      className="sticky top-0 z-20 w-full py-2"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center gap-3 rounded-full border border-cyan-400/20 bg-black/45 px-3 py-2 shadow-[0_0_35px_-22px_rgba(34,211,238,0.9)] backdrop-blur-xl">
          <div className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full bg-cyan-300 text-slate-950 shadow-[0_0_24px_-8px_rgba(34,211,238,0.9)]">
            <motion.span
              className="absolute inset-0 rounded-full border border-cyan-300/60"
              animate={{ scale: [1, 1.45, 1], opacity: [0.7, 0, 0.7] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
            />
            <Zap size={15} />
          </div>
          <div className="relative h-9 flex-1 overflow-hidden rounded-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-black/80 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-black/80 to-transparent" />
            <motion.div
              className="flex h-full items-center gap-12 whitespace-nowrap text-sm font-black uppercase tracking-[0.18em] text-cyan-100 will-change-transform"
              animate={isPaused ? { x: 0 } : { x: ['0%', '-50%'] }}
              transition={{ duration: Math.max(26, items.join('').length * 0.5), repeat: Infinity, ease: 'linear' }}
            >
              {loopItems.map((item, index) => (
                <span key={`${item}-${index}`} className="inline-flex items-center gap-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-300 shadow-[0_0_14px_rgba(196,181,253,0.9)]" />
                  {item}
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
