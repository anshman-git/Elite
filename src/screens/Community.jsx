import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Search, Sparkles, Trophy, UsersRound, Zap } from 'lucide-react';
import { watchCollection } from '../firebase';
import { getDicebearAvatar, getDisplayName, getLevelFromXp } from '../utils';
import { Card, EmptyState, Skeleton } from '../components/ui';

export default function Community({ notify, openProfile }) {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[1.75rem] border border-slate-800/90 bg-[radial-gradient(circle_at_18%_0%,rgba(34,211,238,0.20),transparent_34%),radial-gradient(circle_at_82%_12%,rgba(168,85,247,0.18),transparent_30%),linear-gradient(135deg,#020617,#0f172a_62%,#020617)] p-5 text-white shadow-[0_35px_110px_-75px_rgba(34,211,238,0.45)] sm:p-7">
        <div className="grid gap-5 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
              <UsersRound size={15} /> Community hub
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Find rivals. Follow grinders.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Discover learners by XP, streaks, rank, and profile signals.
            </p>
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
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="p-4">
              <div className="flex gap-3">
                <Skeleton className="h-16 w-16 rounded-2xl" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-9 w-full" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredUsers.length ? (
        <motion.div layout className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredUsers.map((person) => (
            <motion.button
              layout
              key={person.id}
              type="button"
              whileHover={{ y: -4, rotateX: 2, rotateY: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openProfile?.(person.id)}
              className="group rounded-2xl border border-slate-800/90 bg-slate-950/95 p-4 text-left shadow-[0_22px_80px_-55px_rgba(0,0,0,0.9)] transition hover:border-cyan-400/50 hover:bg-slate-900"
            >
              <div className="flex items-start gap-4">
                <img
                  src={getDicebearAvatar(person.id, person.avatarStyle)}
                  alt=""
                  className="h-16 w-16 rounded-2xl border border-cyan-400/20 bg-slate-900 object-cover shadow-[0_0_28px_-14px_rgba(34,211,238,0.8)]"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-black text-white">{getDisplayName(person)}</h3>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{person.bio || 'No bio yet.'}</p>
                    </div>
                    <span className="rounded-xl bg-cyan-400 px-2.5 py-1 text-xs font-black text-slate-950">#{person.originalRank}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                    <MiniStat icon={Zap} value={getLevelFromXp(person.xp)} label="LV" />
                    <MiniStat icon={Trophy} value={person.xp || 0} label="XP" />
                    <MiniStat icon={Flame} value={person.streak || 0} label="Day" />
                    <MiniStat icon={Sparkles} value={person.followers?.length || 0} label="Fans" />
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </motion.div>
      ) : (
        <EmptyState title="No users found" body="Try a different handle, bio keyword, or email." />
      )}
    </div>
  );
}

function MiniStat({ icon: Icon, value, label }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/85 px-2 py-2">
      <Icon className="mx-auto text-cyan-300" size={14} />
      <p className="mt-1 truncate text-sm font-black text-white">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
    </div>
  );
}
