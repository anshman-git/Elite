import { useEffect, useMemo, useState } from 'react';
import { Download, Eye, FileText, Image } from 'lucide-react';
import { watchCollection, watchSubjects } from '../firebase';
import { Button, Card, EmptyState, SearchInput } from '../components/ui';

export default function Resources({ notify }) {
  const [resources, setResources] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [query, setQuery] = useState('');
  const [type, setType] = useState('All');

  useEffect(() => {
    const unsubscribers = [];

    unsubscribers.push(watchCollection('resources', setResources, {
      onError: () => notify('Could not load resources from Firestore.'),
    }));

    unsubscribers.push(watchSubjects(setSubjects, {
      take: 50,
      onError: () => console.error('Could not load subjects.'),
    }));

    return () => unsubscribers.forEach((unsub) => unsub?.());
  }, [notify]);

  const filtered = useMemo(
    () =>
      resources.filter((item) => {
        const text = `${item.title} ${item.subject} ${item.type}`.toLowerCase();
        return text.includes(query.toLowerCase()) && (type === 'All' || item.type === type);
      }),
    [query, resources, type],
  );

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Library</p>
        <h2 className="text-2xl font-black text-slate-950 dark:text-white">PYQs, notes and papers</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Resources are added by admins as public file links.
        </p>
      </div>

      <SearchInput value={query} onChange={setQuery} placeholder="Search subject, PYQ, notes, sample papers" />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {['All', 'PYQ', 'Notes', 'Sample Paper'].map((item) => (
          <button
            key={item}
            onClick={() => setType(item)}
            className={`min-h-10 shrink-0 rounded-xl px-4 text-sm font-bold transition ${
              type === item ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <Card>
        <h3 className="font-black text-slate-950 dark:text-white">Subject categories</h3>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {subjects.map((subject) => (
            <button key={subject.id} className="rounded-2xl bg-slate-50 px-3 py-4 text-sm font-black text-slate-800 transition hover:bg-blue-50 hover:text-blue-700 dark:bg-white/5 dark:text-white">
              {subject.name}
            </button>
          ))}
        </div>
      </Card>

      {filtered.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((item) => (
            <Card key={item.id} interactive>
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10">
                  {item.fileType?.startsWith('image/') ? <Image size={22} /> : <FileText size={22} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{item.type} - {item.subject}</p>
                  <h3 className="mt-1 truncate font-black text-slate-950 dark:text-white">{item.title}</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Uploaded {formatDate(item.createdAt)}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={() => window.open(item.url || item.fileUrl, '_blank', 'noopener,noreferrer')} disabled={!(item.url || item.fileUrl)}>
                  <Eye size={17} /> Preview
                </Button>
                <Button onClick={() => window.open(item.url || item.fileUrl, '_blank', 'noopener,noreferrer')} disabled={!(item.url || item.fileUrl)}>
                  <Download size={17} /> Open
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="Nothing matched" body="Clear the search or switch the filter." />
      )}
    </div>
  );
}

function formatDate(value) {
  const date = value?.toDate?.() || null;
  return date ? date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'just now';
}
