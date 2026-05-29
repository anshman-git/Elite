import { memo, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Flame, Search, Sparkles, Trophy, UsersRound, Zap } from 'lucide-react';
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
      tone: 'from-amber-400 to-orange-500',
      summary,
    };
  }

  if (weeklyPoints >= 400) {
    return {
      title: `Power surge: +${weeklyPoints} weekly points`,
      badge: 'Weekly surge',
      tone: 'from-cyan-400 to-blue-500',
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
    tone: 'from-slate-400 to-slate-200',
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
      className="rounded-[2rem] border border-slate-800/90 bg-slate-950/95 p-5 shadow-[0_25px_80px_-46px_rgba(0,0,0,0.85)]"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={getDicebearAvatar(person.id, person.avatarStyle)}
                alt=""
                className="h-16 w-16 rounded-3xl border border-cyan-400/20 bg-slate-900 object-cover"
              />
              <span className={`absolute right-0 top-0 h-3.5 w-3.5 rounded-full ${activeNow ? 'bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.16)]' : 'bg-slate-600'} ring-2 ring-slate-950`} />
            </div>
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => onOpenProfile?.(person.id)}
                className="text-left"
              >
                <p className="truncate text-lg font-black text-white">{getDisplayName(person)}</p>
                <p className="mt-1 text-sm text-slate-400">{title}</p>
              </button>
            </div>
          </div>
          <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em] text-slate-900 shadow-sm ${activeNow ? 'bg-emerald-300' : 'bg-slate-700/90'}`}>{activityLabel}</span>
        </div>

        <div className="grid gap-3 rounded-[1.5rem] border border-slate-800/90 bg-slate-900/80 p-4 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <p className="text-sm text-slate-300">{summary}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className={`rounded-full bg-gradient-to-r ${tone} px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-white/90 shadow-sm`}>{badge}</span>
              <span className="rounded-full border border-slate-800 bg-slate-950 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">#{person.originalRank}</span>
            </div>
          </div>
          <div className="flex flex-col items-start justify-between gap-3 sm:items-end">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 shadow-inner">
              <Sparkles size={12} />
              {person.streak || 0}d streak
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 shadow-inner">
              <UsersRound size={12} />
              {person.followers?.length || 0} fans
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onReact}
            disabled={isPending}
            className="min-w-[8rem]"
          >
            <Sparkles size={14} />
            {isPending ? 'Cheering…' : 'Cheer'}
          </Button>
          <div className="rounded-full bg-slate-900/80 px-3 py-2 text-sm font-semibold text-slate-300">
            {reactionCount} cheers
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
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[1.75rem] border border-slate-800/90 bg-[radial-gradient(circle_at_18%_0%,rgba(34,211,238,0.20),transparent_34%),radial-gradient(circle_at_82%_12%,rgba(168,85,247,0.18),transparent_30%),linear-gradient(135deg,#020617,#0f172a_62%,#020617)] p-5 text-white shadow-[0_35px_110px_-75px_rgba(34,211,238,0.45)] sm:p-7">
        <div className="grid gap-5 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
              <UsersRound size={15} /> Activity stream
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">The community is moving.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Live streaks, fan moments, and recent milestones reflected in a polished activity stream.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-cyan-400/20 bg-slate-950/75 p-4 text-sm text-slate-200">
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-200">Live now</p>
                <p className="mt-2 text-3xl font-black text-white">{liveCount}</p>
                <p className="mt-1 text-slate-400">active learners in the last 6 minutes</p>
              </div>
              <div className="rounded-3xl border border-slate-800/90 bg-slate-950/75 p-4 text-sm text-slate-200">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Top streak</p>
                <p className="mt-2 text-3xl font-black text-white">{topStreak}d</p>
                <p className="mt-1 text-slate-400">longest streak among the feed</p>
              </div>
              <div className="rounded-3xl border border-slate-800/90 bg-slate-950/75 p-4 text-sm text-slate-200">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Feed volume</p>
                <p className="mt-2 text-3xl font-black text-white">{users.length}</p>
                <p className="mt-1 text-slate-400">profiles shaping the stream</p>
              </div>
            </div>
          </div>
          <label className="flex min-h-13 items-center gap-3 rounded-2xl border border-cyan-400/20 bg-slate-950/75 px-4 text-slate-300 shadow-[0_0_35px_-20px_rgba(34,211,238,0.75)] backdrop-blur-xl">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search users"
              className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-slate-500"
            />
          </label>
        </div>
      </section>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Card key={index} className="p-4">
              <div className="flex gap-3">
                <Skeleton className="h-16 w-16 rounded-2xl" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-12 w-full" />
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
