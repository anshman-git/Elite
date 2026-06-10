import { memo, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowUp, ArrowUpRight, Crown, Flame, Medal, Search, Trophy, UsersRound, Zap } from 'lucide-react';
import { watchCollection } from '../firebase';
import { getDicebearAvatar, getDisplayName } from '../utils';
import { useApp } from '../context/useApp';
import { useReducedMotion } from '../components/motion/useReducedMotion';
import { EmptyState } from '../components/ui';

const PODIUM = {
  1: { label: 'Gold', color: 'from-amber-500/25 to-amber-600/5 bg-bg-surface/40', border: 'border-amber-500/40', badge: 'bg-amber-500 text-slate-950', glow: 'shadow-glow-amber', crown: 'text-amber-500' },
  2: { label: 'Silver', color: 'from-cyan-500/20 to-cyan-600/5 bg-bg-surface/40', border: 'border-cyan-500/35', badge: 'bg-cyan-500 text-slate-950', glow: 'shadow-glow-cyan', crown: 'text-cyan-550' },
  3: { label: 'Bronze', color: 'from-orange-500/20 to-orange-600/5 bg-bg-surface/40', border: 'border-orange-500/35', badge: 'bg-orange-500 text-slate-950', glow: 'shadow-glow-amber', crown: 'text-orange-500' },
};

const RANK_MARK = { 1: '1', 2: '2', 3: '3' };

function PodiumCard({ person, rank, scoreField, openProfile }) {
  const cfg = PODIUM[rank];
  const score = Number(person[scoreField]) || 0;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (rank - 1) * 0.1, duration: 0.4 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={() => openProfile?.(person.id)}
      className={`group relative w-full overflow-hidden rounded-3xl border bg-gradient-to-br p-5 text-left transition-all duration-300 backdrop-blur-md ${cfg.color} ${cfg.border} ${cfg.glow}`}
      style={{ height: rank === 1 ? 'auto' : rank === 2 ? 'calc(100% - 16px)' : 'calc(100% - 32px)' }}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-15 blur-2xl"
        style={{ background: rank === 1 ? '#ffa500' : rank === 2 ? '#22d3ee' : '#f97316' }}
      />
      <div className="relative mb-3 flex justify-center">
        <div className="relative">
          <img
            src={getDicebearAvatar(person.id, person.avatarStyle)}
            alt=""
            className="h-16 w-16 rounded-2xl border border-line bg-bg-raised"
          />
          <span className={`absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-xl text-xs font-black shadow-soft ${cfg.badge}`}>
            {rank}
          </span>
        </div>
      </div>
      <p className="text-center text-sm font-display font-bold text-ink-100 truncate">{getDisplayName(person)}</p>
      <p className={`mt-1 text-center text-2xl font-black font-display tracking-tight ${cfg.crown}`}>{score}</p>
      <p className="text-center text-[10px] font-bold text-ink-400 uppercase tracking-wider">points</p>
      <div className="mt-4 flex justify-center">
        <span className={`rounded-xl px-3 py-1 text-[10px] font-black tracking-wider uppercase shadow-soft ${cfg.badge}`}>
          {cfg.label}
        </span>
      </div>
    </motion.button>
  );
}

function LeaderRowBase({ person, rank, scoreField, isYou, gapToAbove, rankChange, openProfile }) {
  const reduceMotion = useReducedMotion();
  const score = Number(person[scoreField]) || 0;
  const Icon = rank === 1 ? Crown : rank === 2 || rank === 3 ? Medal : Trophy;
  const podiumColor = rank === 1 ? 'text-amber-500' : rank === 2 ? 'text-cyan-500' : rank === 3 ? 'text-orange-500' : 'text-ink-400';

  const rankChangeIndicator = rankChange !== 0 ? (
    <span className={`inline-flex items-center gap-0.5 rounded-xl px-2 py-0.5 text-[9px] font-bold ${
      rankChange > 0 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
    }`}>
      {rankChange > 0 ? <ArrowUp size={8} /> : <ArrowDown size={8} />}
      {Math.abs(rankChange)}
    </span>
  ) : null;

  return (
    <motion.button
      type="button"
      layout
      layoutId={`leader-row-${person.id}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      whileHover={!reduceMotion ? { x: 4 } : {}}
      transition={{ type: 'spring', stiffness: 260, damping: 28, mass: 0.85 }}
      onClick={() => openProfile?.(person.id)}
      className={`group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-300 ${
        isYou
          ? 'border-amber-500/40 bg-amber-500/10 shadow-glow-amber'
          : 'border-line bg-bg-surface/85 backdrop-blur-md hover:border-line-strong hover:shadow-soft'
      }`}
    >
      {/* Rank Circle */}
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${
        isYou ? 'border-amber-500/30 bg-amber-500/20 text-amber-500' : 'border-line bg-bg-inset text-ink-200'
      } font-display font-black text-sm relative`}>
        {rank <= 3 ? RANK_MARK[rank] : `#${rank}`}
        {rankChangeIndicator && (
          <span className="absolute -top-1 -right-1">
            {rankChangeIndicator}
          </span>
        )}
      </div>

      {/* Icon */}
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-bg-inset border border-line-subtle text-ink-200 shadow-soft">
        <Icon className={`h-5 w-5 ${podiumColor}`} />
      </div>

      {/* Profile */}
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-display font-bold ${isYou ? 'text-amber-500' : 'text-ink-100'}`}>
          {getDisplayName(person)}
          {isYou && <span className="ml-2 rounded-xl bg-amber-500/15 px-2 py-0.5 text-[9px] font-bold tracking-[0.15em] text-amber-500">YOU</span>}
        </p>
        <div className="mt-2 flex flex-wrap gap-2 text-[9px] font-bold uppercase tracking-wider text-ink-400">
          <span className="inline-flex items-center gap-1"><Flame size={10} className="text-amber-500" /> {person.streak || 0}d</span>
          <span className="inline-flex items-center gap-1"><Zap size={10} className="text-cyan-500" /> {person.xp || 0} XP</span>
          <span className="inline-flex items-center gap-1"><UsersRound size={10} className="text-indigo-500" /> {person.followers?.length || 0}</span>
        </div>
      </div>

      {/* Score */}
      <div className="shrink-0 text-right">
        <p className={`text-lg font-black font-display tracking-tight ${isYou ? 'text-amber-500' : 'text-cyan-500'}`}>{score.toLocaleString()}</p>
        {gapToAbove > 0 && (
          <span className="mt-1 inline-flex items-center gap-1 rounded-xl bg-bg-inset border border-line-subtle px-2 py-0.5 text-[9px] font-bold text-ink-400">
            <ArrowUpRight size={8} /> {gapToAbove} pts
          </span>
        )}
      </div>
    </motion.button>
  );
}

const LeaderRow = memo(LeaderRowBase, (prevProps, nextProps) => (
  prevProps.rank === nextProps.rank &&
  prevProps.scoreField === nextProps.scoreField &&
  prevProps.isYou === nextProps.isYou &&
  prevProps.gapToAbove === nextProps.gapToAbove &&
  prevProps.rankChange === nextProps.rankChange &&
  prevProps.person.id === nextProps.person.id &&
  prevProps.person.xp === nextProps.person.xp &&
  prevProps.person.streak === nextProps.person.streak &&
  prevProps.person.followers?.length === nextProps.person.followers?.length &&
  prevProps.person.avatarStyle === nextProps.person.avatarStyle &&
  prevProps.person.name === nextProps.person.name &&
  getDisplayName(prevProps.person) === getDisplayName(nextProps.person)
));

export default function Leaderboard({ notify, openProfile }) {
  const { user } = useApp();
  const currentUserId = user?.uid || user?.id;
  const [leaderboard, setLeaderboard] = useState([]);
  const [isWeekly, setIsWeekly] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const sortedLeaderboard = useMemo(() => {
    const scoreField = isWeekly ? 'weeklyPoints' : 'points';
    return [...leaderboard].sort((a, b) => {
      const diff = (Number(b[scoreField]) || 0) - (Number(a[scoreField]) || 0);
      if (diff !== 0) return diff;
      return getDisplayName(a).localeCompare(getDisplayName(b));
    });
  }, [leaderboard, isWeekly]);

  useEffect(() => {
    return watchCollection('users', setLeaderboard, {
      sortField: isWeekly ? 'weeklyPoints' : 'points',
      take: 50,
      onError: () => notify('Could not load leaderboard from Firestore.'),
    });
  }, [notify, isWeekly]);

  const rankedLeaderboard = useMemo(
    () => sortedLeaderboard.map((person, index) => ({ ...person, originalRank: index + 1 })),
    [sortedLeaderboard],
  );

  const rankChanges = useMemo(() => {
    const changes = {};
    rankedLeaderboard.forEach((person, currentRank) => {
      const previousRank = person.previousRank || currentRank + 1;
      changes[person.id] = previousRank - (currentRank + 1);
    });
    return changes;
  }, [rankedLeaderboard]);

  const filteredLeaderboard = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return rankedLeaderboard;
    return rankedLeaderboard.filter((person) => {
      const name = getDisplayName(person).toLowerCase();
      const email = (person.email || '').toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }, [searchQuery, rankedLeaderboard]);

  const gapByUserId = useMemo(() => {
    const scoreField = isWeekly ? 'weeklyPoints' : 'points';
    return rankedLeaderboard.reduce((map, person, index) => {
      if (index === 0) {
        map[person.id] = 0;
        return map;
      }
      const prevScore = Number(rankedLeaderboard[index - 1][scoreField]) || 0;
      map[person.id] = prevScore - (Number(person[scoreField]) || 0);
      return map;
    }, {});
  }, [rankedLeaderboard, isWeekly]);

  const scoreField = isWeekly ? 'weeklyPoints' : 'points';
  const top3 = rankedLeaderboard.slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-500">Hall of Fame</p>
          <h2 className="text-3xl font-black text-ink-100 font-display">Rankings</h2>
          <p className="mt-1 text-sm text-ink-400 font-semibold">{rankedLeaderboard.length} members ranked</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-2xl border border-line bg-bg-surface/80 p-1 shadow-soft">
            <button
              onClick={() => setIsWeekly(true)}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition-all duration-200 ${
                isWeekly ? 'bg-amber-500 text-slate-950 shadow-glow-amber' : 'text-ink-450 hover:text-ink-100'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setIsWeekly(false)}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition-all duration-200 ${
                !isWeekly ? 'bg-amber-500 text-slate-950 shadow-glow-amber' : 'text-ink-450 hover:text-ink-100'
              }`}
            >
              All-time
            </button>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search users..."
              className="h-10 rounded-xl border border-line bg-bg-surface/85 pl-8 pr-4 text-sm font-bold text-ink-100 placeholder-ink-600 outline-none transition-all duration-200 focus:border-amber-500 focus:shadow-glow-amber"
            />
          </div>
        </div>
      </div>

      {!searchQuery && top3.length >= 3 && (
        <div className="py-4">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-ink-400">Top Performers</p>
          <div className="grid grid-cols-3 items-end gap-3 sm:gap-6 max-w-2xl mx-auto">
            {[top3[1], top3[0], top3[2]].filter(Boolean).map((person, index) => {
              const displayRank = index === 0 ? 2 : index === 1 ? 1 : 3;
              return (
                <div
                  key={person.id}
                  className={index === 1 ? 'order-2' : index === 0 ? 'order-1' : 'order-3'}
                  style={{ marginBottom: index === 1 ? 0 : index === 0 ? '-16px' : '-32px' }}
                >
                  <PodiumCard person={person} rank={displayRank} scoreField={scoreField} openProfile={openProfile} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-3 pt-6">
        {!searchQuery && <p className="text-[10px] font-bold uppercase tracking-widest text-ink-400">Full Rankings</p>}
        {filteredLeaderboard.length ? (
          <AnimatePresence>
            {filteredLeaderboard.map((person) => (
              <LeaderRow
                key={person.id}
                person={person}
                rank={person.originalRank}
                scoreField={scoreField}
                isYou={person.id === currentUserId}
                gapToAbove={gapByUserId[person.id] || 0}
                rankChange={rankChanges[person.id] || 0}
                openProfile={openProfile}
              />
            ))}
          </AnimatePresence>
        ) : (
          <EmptyState title="No results" body={searchQuery ? `No user matches "${searchQuery}"` : 'Rankings will appear after members earn points.'} />
        )}
      </div>

      {rankedLeaderboard.length > 0 && (
        <div className="grid grid-cols-2 gap-4 rounded-3xl border border-line bg-bg-surface/80 p-5 sm:grid-cols-4 shadow-soft">
          <div className="text-center p-2">
            <p className="text-2xl font-black text-ink-100 font-display">{rankedLeaderboard.length}</p>
            <p className="text-xs text-ink-400 font-semibold mt-1">Participants</p>
          </div>
          <div className="text-center p-2">
            <p className="text-2xl font-black text-amber-500 font-display">{Number(rankedLeaderboard[0]?.[scoreField]) || 0}</p>
            <p className="text-xs text-ink-400 font-semibold mt-1">Top Score</p>
          </div>
          <div className="text-center p-2">
            <p className="text-2xl font-black text-cyan-500 font-display">
              {rankedLeaderboard.length
                ? Math.round(rankedLeaderboard.reduce((sum, person) => sum + (Number(person[scoreField]) || 0), 0) / rankedLeaderboard.length)
                : 0}
            </p>
            <p className="text-xs text-ink-400 font-semibold mt-1">Avg Score</p>
          </div>
          <div className="text-center p-2">
            <p className="text-2xl font-black text-emerald-500 font-display">
              {Math.max(...rankedLeaderboard.map((person) => person.streak || 0), 0)}d
            </p>
            <p className="text-xs text-ink-400 font-semibold mt-1">Best Streak</p>
          </div>
        </div>
      )}
    </div>
  );
}
