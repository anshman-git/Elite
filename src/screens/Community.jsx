import { memo, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Sparkles, UsersRound } from 'lucide-react';
import { watchCollection } from '../firebase';
import { getDicebearAvatar, getDisplayName, getLevelFromXp } from '../utils';
import { Button, Card, EmptyState, Skeleton } from '../components/ui';
import { useReducedMotion } from '../components/motion/useReducedMotion';

function formatRecentActivity(date, now) {
  if (!date) return 'No recent activity';
  const diff = now - date.getTime();
  if (diff < 60_000) return 'Active now';
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`;
  return `${Math.round(diff / 86_400_000)}d ago`;
}

function buildActivityInfo(person) {
  const followers = person.followers?.length || 0;
  const weeklyPoints = Number(person.weeklyPoints) || 0;
  const streak = Number(person.streak) || 0;
  const level = getLevelFromXp(person.xp);
  const summary = person.bio || `Level ${level} learner with ${weeklyPoints} weekly points.`;

  if (streak >= 7) {
    return {
      title: `Fueling a ${streak}d streak`,
      badge: 'Streak fire',
      tone: 'from-amber-500 to-orange-500',
      summary,
    };
  }

  if (weeklyPoints >= 400) {
    return {
      title: `Power surge: +${weeklyPoints} weekly points`,
      badge: 'Weekly surge',
      tone: 'from-cyan-400 to-cyan-600',
      summary,
    };
  }

  if (followers >= 20) {
    return {
      title: `Crowd magnet with ${followers} fans`,
      badge: 'Fan favorite',
      tone: 'from-cyan-400 to-amber-500',
      summary,
    };
  }

  return {
    title: `Level ${level} grind mode`,
    badge: 'Rising star',
    tone: 'from-ink-400 to-ink-600',
    summary,
  };
}

function getActiveTimestamp(person) {
  const timestamp = person.lastActiveAt?.toDate?.() || (person.lastActiveAt instanceof Date ? person.lastActiveAt : null);
  return timestamp;
}

const ActivityCard = memo(function ActivityCard({
  person,
  reactionCount,
  isPending,
  onReact,
  onOpenProfile,
  reducedMotion,
  now,
}) {
  const { title, badge, tone, summary } = buildActivityInfo(person);
  const lastActiveAt = getActiveTimestamp(person);
  const activityLabel = formatRecentActivity(lastActiveAt, now);
  const activeNow = activityLabel === 'Active now';

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: reducedMotion ? 0 : 18, scale: reducedMotion ? 1 : 0.997 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: reducedMotion ? 0 : 10 }}
      transition={{ duration: reducedMotion ? 0.18 : 0.35, ease: 'easeOut' }}
      className="rounded-2xl border border-line bg-bg-surface p-5 shadow-card transition-all duration-200 hover:border-line-strong hover:shadow-card-hover"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <img
                src={getDicebearAvatar(person.id, person.avatarStyle)}
                alt=""
                className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl border border-line bg-bg-raised object-cover"
              />
              <span
                className={`absolute right-0 top-0 h-3 w-3 rounded-full ring-2 ring-bg-surface ${
                  activeNow ? 'bg-success shadow-[0_0_0_3px_rgba(52,211,153,0.25)]' : 'bg-ink-600'
                }`}
              />
            </div>
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => onOpenProfile?.(person.id)}
                className="text-left group block max-w-full"
              >
                <p className="truncate text-base sm:text-lg font-bold font-display text-ink-100 group-hover:text-cyan-500 transition-colors">
                  {getDisplayName(person)}
                </p>
                <p className="mt-0.5 truncate text-xs sm:text-sm text-ink-400 font-medium">{title}</p>
              </button>
            </div>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm ${
              activeNow
                ? 'bg-success/15 text-success border border-success/30'
                : 'bg-bg-raised text-ink-400 border border-line'
            }`}
          >
            {activityLabel}
          </span>
        </div>

        <div className="grid gap-3 rounded-xl border border-line bg-bg-inset/40 p-4 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <p className="text-sm text-ink-200 line-clamp-2">{summary}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={`rounded-full bg-gradient-to-r ${tone} px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-bg-base shadow-sm`}>
                {badge}
              </span>
              <span className="rounded-full border border-line bg-bg-surface px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-ink-400">
                #{person.originalRank}
              </span>
            </div>
          </div>
          <div className="flex flex-row flex-wrap items-center gap-2 sm:flex-col sm:items-end sm:justify-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg-surface px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-ink-400 shadow-sm">
              <Sparkles size={12} className="text-amber-500" />
              {person.streak || 0}d streak
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg-surface px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-ink-400 shadow-sm">
              <UsersRound size={12} className="text-cyan-500" />
              {person.followers?.length || 0} fans
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <motion.button
            type="button"
            onClick={onReact}
            disabled={isPending}
            className="min-w-[7.5rem] inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-bg-raised px-4 py-2 text-sm font-bold text-ink-200 transition-all duration-200 hover:border-cyan-500/40 hover:bg-bg-surface hover:text-ink-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-card"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            animate={isPending ? { scale: [1, 1.1, 1] } : {}}
            transition={isPending ? { duration: 0.3, times: [0, 0.5, 1] } : {}}
          >
            <motion.span
              animate={isPending ? { rotate: [0, 360] } : {}}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <Sparkles size={14} className="text-amber-500" />
            </motion.span>
            {isPending ? 'Cheering…' : 'Cheer'}
          </motion.button>
          <div className="rounded-lg border border-line-subtle bg-bg-inset px-3 py-1.5 text-xs font-bold text-ink-200">
            {reactionCount} {reactionCount === 1 ? 'cheer' : 'cheers'}
          </div>
        </div>
      </div>
    </motion.article>
  );
}, (prev, next) => {
  return (
    prev.person.id === next.person.id &&
    prev.person.weeklyPoints === next.person.weeklyPoints &&
    prev.person.xp === next.person.xp &&
    prev.person.streak === next.person.streak &&
    prev.person.followers?.length === next.person.followers?.length &&
    prev.reactionCount === next.reactionCount &&
    prev.isPending === next.isPending &&
    prev.reducedMotion === next.reducedMotion
  );
});

export default function Community({ notify, openProfile }) {
  const reducedMotion = useReducedMotion();
  const [now] = useState(() => Date.now());
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [reactionState, setReactionState] = useState({});

  useEffect(() => {
    return watchCollection('users', (items) => {
      setUsers(items);
      setLoading(false);
    }, {
      sortField: 'weeklyPoints',
      take: 100,
      onError: () => {
        setLoading(false);
        notify?.('Could not load the community.');
      },
    });
  }, [notify]);

  const liveCount = useMemo(() => {
    return users.filter((person) => {
      const lastActive = getActiveTimestamp(person);
      return lastActive && now - lastActive.getTime() < 6 * 60_000;
    }).length;
  }, [users, now]);

  const rankedUsers = useMemo(() => {
    return [...users]
      .sort((left, right) => (Number(right.weeklyPoints) || 0) - (Number(left.weeklyPoints) || 0))
      .map((person, index) => ({ ...person, originalRank: index + 1 }));
  }, [users]);

  const filteredUsers = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return rankedUsers;
    return rankedUsers.filter((person) => {
      const name = getDisplayName(person).toLowerCase();
      const bio = (person.bio || '').toLowerCase();
      const email = (person.email || '').toLowerCase();
      return name.includes(value) || bio.includes(value) || email.includes(value);
    });
  }, [rankedUsers, query]);

  const topStreak = useMemo(() => Math.max(...users.map((person) => Number(person.streak) || 0), 0), [users]);

  const handleCheer = (personId) => {
    setReactionState((current) => {
      const currentState = current[personId] || { count: 0, pending: false };
      if (currentState.pending) return current;
      return {
        ...current,
        [personId]: {
          count: currentState.count + 1,
          pending: true,
        },
      };
    });
    window.setTimeout(() => {
      setReactionState((current) => ({
        ...current,
        [personId]: {
          ...current[personId],
          pending: false,
        },
      }));
    }, reducedMotion ? 300 : 700);
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-bg-surface via-bg-surface to-bg-raised p-5 sm:p-7 shadow-card">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="relative grid gap-6 lg:grid-cols-[1fr_340px] lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-500">
              <UsersRound size={15} /> Activity stream
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-ink-100 font-display sm:text-3xl">
              The community is moving.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-400 font-medium">
              Live streaks, fan moments, and recent milestones reflected in a polished activity stream.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-cyan-500/25 bg-bg-surface/90 p-4 text-sm shadow-card">
                <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-500">Live now</p>
                <p className="mt-1.5 text-2xl sm:text-3xl font-black text-ink-100 font-display">{liveCount}</p>
                <p className="mt-1 text-xs text-ink-400 font-medium">active learners (last 6m)</p>
              </div>
              <div className="rounded-xl border border-line bg-bg-surface/90 p-4 text-sm shadow-card">
                <p className="text-[11px] font-bold uppercase tracking-widest text-amber-500">Top streak</p>
                <p className="mt-1.5 text-2xl sm:text-3xl font-black text-amber-500 font-display">{topStreak}d</p>
                <p className="mt-1 text-xs text-ink-400 font-medium">longest active streak</p>
              </div>
              <div className="rounded-xl border border-line bg-bg-surface/90 p-4 text-sm shadow-card">
                <p className="text-[11px] font-bold uppercase tracking-widest text-ink-400">Feed volume</p>
                <p className="mt-1.5 text-2xl sm:text-3xl font-black text-ink-100 font-display">{users.length}</p>
                <p className="mt-1 text-xs text-ink-400 font-medium">profiles in stream</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-line bg-bg-surface px-4 py-3 text-ink-200 shadow-card focus-within:border-cyan-500/60 focus-within:ring-1 focus-within:ring-cyan-500/40 transition-all duration-200">
            <Search size={18} className="pointer-events-none text-ink-400 shrink-0" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search users..."
              className="w-full bg-transparent text-sm font-bold text-ink-100 outline-none placeholder:text-ink-600"
            />
          </div>
        </div>
      </section>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="p-5 rounded-2xl border-line bg-bg-surface shadow-card">
              <div className="flex gap-3">
                <Skeleton className="h-14 w-14 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2.5">
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                  <Skeleton className="h-3 w-1/2 rounded-md" />
                  <Skeleton className="h-16 w-full rounded-xl" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredUsers.length ? (
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            layout
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: reducedMotion ? 0 : 0.06 } },
            }}
            initial="hidden"
            animate="visible"
          >
            {filteredUsers.map((person) => {
              const reactionStateForPerson = reactionState[person.id] || { count: 0, pending: false };
              return (
                <ActivityCard
                  key={person.id}
                  person={person}
                  reactionCount={(person.followers?.length || 0) + reactionStateForPerson.count}
                  isPending={reactionStateForPerson.pending}
                  onReact={() => handleCheer(person.id)}
                  onOpenProfile={openProfile}
                  reducedMotion={reducedMotion}
                  now={now}
                />
              );
            })}
          </motion.div>
        </AnimatePresence>
      ) : (
        <EmptyState
          title="Quiet moment in the stream"
          body="No matching profiles found. Try a broader search or refresh the community feed soon."
          action={
            <Button type="button" onClick={() => setQuery('')}>
              Clear search
            </Button>
          }
        />
      )}
    </div>
  );
}
