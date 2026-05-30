import { memo, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowUp, ArrowUpRight, Crown, Flame, Medal, Search, Trophy, UsersRound, Zap } from 'lucide-react';
import { watchCollection } from '../firebase';
import { getDicebearAvatar, getDisplayName } from '../utils';
import { useApp } from '../context/useApp';
import { useReducedMotion } from '../components/motion/useReducedMotion';
import { EmptyState } from '../components/ui';

const PODIUM = {
  1: { label: 'Gold', color: 'from-yellow-400/30 to-yellow-600/10', border: 'border-yellow-400/40', badge: 'bg-yellow-400 text-slate-950', glow: 'shadow-[0_0_40px_-10px_rgba(250,204,21,0.5)]', crown: 'text-yellow-400' },
  2: { label: 'Silver', color: 'from-slate-300/20 to-slate-500/10', border: 'border-slate-400/30', badge: 'bg-slate-300 text-slate-950', glow: 'shadow-[0_0_30px_-10px_rgba(203,213,225,0.3)]', crown: 'text-slate-300' },
  3: { label: 'Bronze', color: 'from-orange-400/20 to-orange-700/10', border: 'border-orange-400/30', badge: 'bg-orange-400 text-slate-950', glow: 'shadow-[0_0_30px_-10px_rgba(251,146,60,0.35)]', crown: 'text-orange-400' },
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
      className={`group relative w-full overflow-hidden rounded-3xl border bg-gradient-to-br p-5 text-left transition-[transform,opacity,border-color,box-shadow] duration-200 ${cfg.color} ${cfg.border} ${cfg.glow}`}
      style={{ height: rank === 1 ? 'auto' : rank === 2 ? 'calc(100% - 24px)' : 'calc(100% - 48px)' }}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-30 blur-2xl"
        style={{ background: rank === 1 ? '#fbbf24' : rank === 2 ? '#cbd5e1' : '#fb923c' }}
      />
      <div className="relative mb-3 flex justify-center">
        <img
          src={getDicebearAvatar(person.id, person.avatarStyle)}
          alt=""
          className="h-16 w-16 rounded-2xl border-2 border-white/20 bg-slate-800"
        />
        <span className={`absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${cfg.badge}`}>
          {rank}
        </span>
      </div>
      <p className="text-center text-sm font-black text-white">{getDisplayName(person)}</p>
      <p className={`mt-1 text-center text-xl font-black ${cfg.crown}`}>{score}</p>
      <p className="text-center text-[10px] font-bold text-slate-500">points</p>
      <div className="mt-3 flex justify-center">
        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${cfg.badge}`}>
          #{rank} {cfg.label}
        </span>
      </div>
    </motion.button>
  );
}

function LeaderRowBase({ person, rank, scoreField, isYou, gapToAbove, rankChange, openProfile }) {
  const reduceMotion = useReducedMotion();
  const score = Number(person[scoreField]) || 0;
  const Icon = rank === 1 ? Crown : rank === 2 || rank === 3 ? Medal : Trophy;
  const podiumColor = rank === 1 ? 'text-amber-400' : rank === 2 ? 'text-cyan-300' : rank === 3 ? 'text-amber-500' : 'text-slate-400';

  const rankChangeIndicator = rankChange !== 0 ? (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
      rankChange > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
    }`}>
      {rankChange > 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
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
      className={`group flex w-full items-center gap-4 rounded-3xl border px-4 py-4 text-left transition-[background-color,border-color,box-shadow,transform,opacity] duration-200 ${
        isYou
          ? 'border-amber-500/40 bg-amber-500/10 shadow-[0_0_32px_-12px_rgba(251,191,36,0.35)]'
          : 'border-white/10 bg-slate-900/70 hover:border-cyan-500/30 hover:bg-slate-900/85'
      }`}
    >
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
        isYou ? 'border-amber-300/50 bg-amber-500/15 text-amber-200' : 'border-white/10 bg-slate-950 text-slate-300'
      } font-black text-sm relative`}>
        {rank <= 3 ? RANK_MARK[rank] : `#${rank}`}
        {rankChangeIndicator && (
          <span className="absolute -top-1 -right-1">
            {rankChangeIndicator}
          </span>
        )}
      </div>

      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950/80 text-slate-300 shadow-sm">
        <Icon className={`h-5 w-5 ${podiumColor}`} />
      </div>

      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-black ${isYou ? 'text-amber-100' : 'text-white'}`}>
          {getDisplayName(person)}
          {isYou && <span className="ml-2 rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">YOU</span>}
        </p>
        <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          <span className="inline-flex items-center gap-1"><Flame size={10} /> {person.streak || 0}d</span>
          <span className="inline-flex items-center gap-1"><Zap size={10} /> {person.xp || 0} XP</span>
          <span className="inline-flex items-center gap-1"><UsersRound size={10} /> {person.followers?.length || 0}</span>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className={`text-lg font-black ${isYou ? 'text-amber-200' : 'text-cyan-300'}`}>{score.toLocaleString()}</p>
        {gapToAbove > 0 && (
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-1 text-[10px] font-bold text-slate-400">
            <ArrowUpRight size={10} /> {gapToAbove} pts
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
          <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Hall of Fame</p>
          <h2 className="text-3xl font-black text-white">{isWeekly ? 'Weekly' : 'All-time'} Rankings</h2>
          <p className="mt-1 text-sm text-slate-500">{rankedLeaderboard.length} members ranked</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-2xl border border-white/10 bg-slate-900/60 p-1">
            <button
              onClick={() => setIsWeekly(true)}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition-[background-color,color,box-shadow] duration-200 ${
                isWeekly ? 'bg-cyan-500 text-slate-950 shadow-[0_0_16px_-4px_rgba(34,211,238,0.6)]' : 'text-slate-400 hover:text-white'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setIsWeekly(false)}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition-[background-color,color,box-shadow] duration-200 ${
                !isWeekly ? 'bg-cyan-500 text-slate-950 shadow-[0_0_16px_-4px_rgba(34,211,238,0.6)]' : 'text-slate-400 hover:text-white'
              }`}
            >
              All-time
            </button>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search users..."
              className="h-10 rounded-xl border border-white/10 bg-slate-900/80 pl-8 pr-4 text-sm font-bold text-white placeholder-slate-600 outline-none transition-[border-color,box-shadow] duration-200 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
            />
          </div>
        </div>
      </div>

      {!searchQuery && top3.length >= 3 && (
        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Top Performers</p>
          <div className="grid grid-cols-3 items-end gap-3">
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

      <div className="space-y-2">
        {!searchQuery && <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Full Rankings</p>}
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
        <div className="grid grid-cols-2 gap-3 rounded-3xl border border-white/10 bg-slate-900/60 p-4 sm:grid-cols-4">
          <div className="text-center">
            <p className="text-2xl font-black text-white">{rankedLeaderboard.length}</p>
            <p className="text-xs text-slate-500">Participants</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-yellow-400">{Number(rankedLeaderboard[0]?.[scoreField]) || 0}</p>
            <p className="text-xs text-slate-500">Top Score</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-cyan-300">
              {rankedLeaderboard.length
                ? Math.round(rankedLeaderboard.reduce((sum, person) => sum + (Number(person[scoreField]) || 0), 0) / rankedLeaderboard.length)
                : 0}
            </p>
            <p className="text-xs text-slate-500">Avg Score</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-cyan-300">
              {Math.max(...rankedLeaderboard.map((person) => person.streak || 0), 0)}d
            </p>
            <p className="text-xs text-slate-500">Best Streak</p>
          </div>
        </div>
      )}
    </div>
  );
}
