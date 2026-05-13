import { LogOut, Settings, UserRound } from 'lucide-react';
import { logout } from '../firebase';
import { Button, Card } from '../components/ui';

export default function Profile({ user, notify }) {
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-3xl bg-blue-600 text-white">
            <UserRound size={30} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-950 dark:text-white">{user?.displayName || 'Elite learner'}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email || 'demo@elitestudy.app'}</p>
          </div>
        </div>
      </Card>
      <Card>
        <h3 className="font-black text-slate-950 dark:text-white">Profile stats</h3>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat value="12" label="Streak" />
          <Stat value="42" label="Quizzes" />
          <Stat value="#3" label="Rank" />
        </div>
      </Card>
      <Card>
        <h3 className="font-black text-slate-950 dark:text-white">Settings</h3>
        <div className="mt-3 space-y-2">
          <Toggle label="Daily quiz reminder" />
          <Toggle label="New notes alerts" />
          <Toggle label="Exam countdown nudges" />
        </div>
      </Card>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button variant="secondary"><Settings size={17} /> Account settings</Button>
        <Button
          variant="ghost"
          onClick={async () => {
            await logout();
            notify('Signed out.');
          }}
        >
          <LogOut size={17} /> Sign out
        </Button>
      </div>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
      <p className="text-2xl font-black text-blue-600">{value}</p>
      <p className="text-xs font-bold text-slate-400">{label}</p>
    </div>
  );
}

function Toggle({ label }) {
  return (
    <label className="flex min-h-12 items-center justify-between rounded-2xl bg-slate-50 px-4 text-sm font-bold text-slate-700 dark:bg-white/5 dark:text-slate-200">
      {label}
      <input type="checkbox" defaultChecked className="h-5 w-5 accent-blue-600" />
    </label>
  );
}
