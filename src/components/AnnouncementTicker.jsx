import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

export default function AnnouncementTicker({ announcements = null }) {
  const containerRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

  // Default announcements - only 2 concise updates
  const defaultAnnouncements = [
    "🔥 Weekly Quiz Live",
    "🏆 Leaderboard Rewards"
  ];

  const items = announcements || defaultAnnouncements;
  
  // Create seamless loop by repeating items multiple times
  const loopItems = [...items, ...items, ...items];
  const displayText = loopItems.join("           ");

  const marqueeVariants = {
    animate: {
      x: [0, -100],
      transition: {
        duration: 35,
        repeat: Infinity,
        ease: "linear",
        repeatType: "loop",
        paused: isPaused,
      },
    },
  };

  return (
    <div 
      ref={containerRef}
      className="sticky top-0 z-50 w-full bg-black/40 backdrop-blur-md py-2 sm:py-2.5"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Container with max-width and centered */}
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Icon with subtle glow pulse */}
          <div className="flex-shrink-0">
            <div className="relative inline-flex items-center justify-center">
              {/* Glow pulse effect - behind icon only */}
              <div className="absolute inset-0 rounded-full bg-cyan-500/30 blur-md animate-pulse" />
              
              {/* Icon container */}
              <div className="relative rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 p-1.5 shadow-[0_0_12px_rgba(34,211,238,0.5)]">
                <Zap size={14} className="text-slate-950 sm:h-4 sm:w-4" />
              </div>
            </div>
          </div>

          {/* Slim rounded pill container with glass effect */}
          <div className="flex-1 h-11 sm:h-12 rounded-full bg-gradient-to-r from-slate-900/60 to-slate-950/60 border border-cyan-400/25 backdrop-blur-xl shadow-[0_0_20px_rgba(34,211,238,0.15)] overflow-hidden group">
            
            {/* Fading edges effect - left gradient */}
            <div className="absolute inset-y-0 left-0 w-8 sm:w-12 bg-gradient-to-r from-slate-900/80 to-transparent z-10 pointer-events-none" />
            
            {/* Fading edges effect - right gradient */}
            <div className="absolute inset-y-0 right-0 w-8 sm:w-12 bg-gradient-to-l from-slate-900/80 to-transparent z-10 pointer-events-none" />

            {/* Scrolling text */}
            <div className="relative h-full overflow-hidden flex items-center">
              <motion.div
                variants={marqueeVariants}
                animate={isPaused ? "paused" : "animate"}
                className="flex whitespace-nowrap text-xs sm:text-sm font-semibold tracking-wide will-change-transform"
              >
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-cyan-200 to-cyan-300 pr-16 sm:pr-24">
                  {displayText}
                </span>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
