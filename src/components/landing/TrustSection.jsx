import { useEffect, useState, useRef } from 'react';
import { useInView } from 'framer-motion';
import { Users, CheckCircle, BookOpen, Activity } from 'lucide-react';

export default function TrustSection() {
  const stats = [
    {
      icon: Users,
      value: 12000,
      suffix: '+',
      label: 'Students Learning',
      color: 'text-amber-500 bg-amber-500/10',
    },
    {
      icon: CheckCircle,
      value: 500,
      suffix: 'K+',
      label: 'Questions Solved',
      color: 'text-cyan-500 bg-cyan-500/10',
    },
    {
      icon: BookOpen,
      value: 2500,
      suffix: '+',
      label: 'Study Notes Available',
      color: 'text-amber-500 bg-amber-500/10',
    },
    {
      icon: Activity,
      value: 3200,
      suffix: '+',
      label: 'Daily Active Users',
      color: 'text-cyan-500 bg-cyan-500/10',
    },
  ];

  return (
    <section className="py-12 border-y border-line-subtle bg-bg-surface/30 backdrop-blur-sm relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, idx) => (
            <StatCard key={idx} stat={stat} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StatCard({ stat }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    
    let start = 0;
    const end = stat.value;
    const duration = 1800; // milliseconds
    const increment = end / (duration / 16); // ~60fps
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [isInView, stat.value]);

  const Icon = stat.icon;

  return (
    <div
      ref={ref}
      className="flex flex-col items-center text-center p-4 rounded-xl border border-line bg-bg-surface/50 shadow-card hover:shadow-card-hover hover:border-line-strong transition-all duration-200"
    >
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
        <Icon className="h-5.5 w-5.5" />
      </div>
      <span className="text-3xl sm:text-4xl font-display font-black text-ink-100 tracking-tight select-none">
        {count.toLocaleString()}
        <span className="text-amber-500">{stat.suffix}</span>
      </span>
      <span className="text-xs sm:text-sm font-semibold text-ink-400 mt-1">
        {stat.label}
      </span>
    </div>
  );
}
