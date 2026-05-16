import { useEffect, useMemo, useState } from 'react';
import { BarChart3, TrendingDown, TrendingUp } from 'lucide-react';
import { watchUserAttempts, watchSubjects } from '../firebase';
import AttemptReviewModal from '../components/AttemptReviewModal';
import { useApp } from '../context/useApp';
import { Button, Card, ProgressBar } from '../components/ui';

export default function Performance({ notify }) {
  const { user, notify: globalNotify } = useApp();
  const [attempts, setAttempts] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [reviewAttemptId, setReviewAttemptId] = useState(null);

  useEffect(() => {
    const unsubscribers = [];
    
    if (user?.uid) {
      unsubscribers.push(watchUserAttempts(user.uid, setAttempts, {
        onError: () => globalNotify('Could not load your attempts from Firestore.'),
      }));
    }
    
    unsubscribers.push(watchSubjects(setSubjects, {
      take: 50,
      onError: () => console.error('Could not load subjects.'),
    }));
    
    return () => unsubscribers.forEach(unsub => unsub?.());
  }, [user?.uid, globalNotify]);

  const userAttempts = attempts;

  const averageAccuracy = userAttempts.length
    ? Math.round(userAttempts.reduce((sum, attempt) => sum + (attempt.accuracy || 0), 0) / userAttempts.length)
    : 0;

  const subjectStats = subjects.map((subject) => {
    const subjectAttempts = userAttempts.filter((attempt) => attempt.subject === subject.name);
    const progress = subjectAttempts.length
      ? Math.round(subjectAttempts.reduce((sum, attempt) => sum + (attempt.accuracy || 0), 0) / subjectAttempts.length)
      : 0;
    return { ...subject, progress };
  });

  const weakestSubject = subjectStats
    .filter((subject) => subject.progress > 0)
    .sort((a, b) => a.progress - b.progress)[0]?.name || '-';

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Analytics</p>
        <h2 className="text-2xl font-black text-slate-950 dark:text-white">Performance overview</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card><BarChart3 className="text-blue-600" /><p className="mt-3 text-2xl font-black">{userAttempts.length}</p><p className="text-sm text-slate-500">Quizzes attempted</p></Card>
        <Card><TrendingUp className="text-emerald-600" /><p className="mt-3 text-2xl font-black">{averageAccuracy}%</p><p className="text-sm text-slate-500">Average accuracy</p></Card>
        <Card><TrendingDown className="text-rose-600" /><p className="mt-3 text-2xl font-black">{weakestSubject}</p><p className="text-sm text-slate-500">Weakest subject</p></Card>
      </div>
      <Card>
        <h3 className="font-black text-slate-950 dark:text-white">Subject strengths</h3>
        <div className="mt-4 space-y-4">
          {subjectStats.map((subject) => (
            <div key={subject.id}>
              <div className="mb-2 flex justify-between text-sm font-bold">
                <span>{subject.name}</span>
                <span className="text-blue-600">{subject.progress}%</span>
              </div>
              <ProgressBar value={subject.progress} />
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h3 className="font-black text-slate-950 dark:text-white">Attempt history</h3>
        <div className="mt-4 space-y-3">
          {userAttempts.slice(0, 10).map((attempt) => (
            <div
              key={attempt.id}
              className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-bold text-slate-950 dark:text-white">
                  {attempt.quizTitle || attempt.subject || 'Quiz attempt'}
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {attempt.score}/{attempt.total} · {attempt.accuracy || 0}%
                </p>
              </div>
              <Button variant="secondary" onClick={() => setReviewAttemptId(attempt.id)}>
                Review Attempt
              </Button>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h3 className="font-black text-slate-950 dark:text-white">Weekly progress</h3>
        <div className="mt-4 flex h-48 items-end gap-2">
          {getWeeklyBars(userAttempts).map((height, index) => (
            <div key={index} className="flex flex-1 flex-col items-center gap-2">
              <div className="w-full rounded-t-2xl bg-blue-600" style={{ height: `${Math.max(height, 2)}%` }} />
              <span className="text-xs font-bold text-slate-400">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</span>
            </div>
          ))}
        </div>
      </Card>
      <AttemptReviewModal attemptId={reviewAttemptId} onClose={() => setReviewAttemptId(null)} />
    </div>
  );
}

function getWeeklyBars(attempts) {
  const buckets = [0, 0, 0, 0, 0, 0, 0];
  attempts.forEach((attempt) => {
    const date = attempt.completedAt?.toDate?.();
    if (!date) return;
    const index = (date.getDay() + 6) % 7;
    buckets[index] = Math.min(100, buckets[index] + 20);
  });
  return buckets;
}
