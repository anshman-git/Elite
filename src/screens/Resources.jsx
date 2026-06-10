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

  const typeCounts = useMemo(() => {
    const counts = { 'All': resources.length };
    ['PYQ', 'Notes', 'Sample Paper'].forEach((t) => {
      counts[t] = resources.filter((item) => item.type === t).length;
    });
    return counts;
  }, [resources]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-500">Library</p>
        <h2 className="text-3xl font-black text-ink-100 font-display">Study Library</h2>
        <p className="mt-1 text-sm text-ink-400 font-semibold">
          Curated notes, previous year question papers, and sample templates compiled for college students.
        </p>
      </div>

      <SearchInput value={query} onChange={setQuery} placeholder="Search subject, PYQ, notes, sample papers..." />

      <div className="flex gap-2.5 overflow-x-auto pb-2 select-none">
        {['All', 'PYQ', 'Notes', 'Sample Paper'].map((item) => (
          <button
            key={item}
            onClick={() => setType(item)}
            className={`min-h-11 shrink-0 rounded-2xl px-5 text-sm font-bold transition-all duration-200 outline-none flex items-center gap-2 ${
              type === item 
                ? 'bg-amber-500 text-slate-950 shadow-glow-amber border border-amber-500/25' 
                : 'bg-bg-surface text-ink-200 border border-line hover:border-line-strong hover:bg-bg-raised/70'
            }`}
          >
            {item} 
            <span className={`rounded-xl px-2 py-0.5 text-xs font-mono font-bold ${
              type === item ? 'bg-slate-950/15 text-slate-950' : 'bg-bg-inset border border-line text-ink-200'
            }`}>
              {typeCounts[item] || 0}
            </span>
          </button>
        ))}
      </div>

      <Card className="grid-bg">
        <h3 className="font-display font-bold text-ink-100 text-sm mb-4">Subject Categories</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {subjects.map((subject) => (
            <button 
              key={subject.id} 
              className="rounded-2xl border border-line bg-bg-raised/50 px-4 py-4 text-center text-sm font-display font-bold text-ink-100 transition-all duration-200 hover:bg-bg-raised hover:text-amber-500 hover:border-amber-500/35 hover:-translate-y-0.5 shadow-soft"
            >
              {subject.name}
            </button>
          ))}
        </div>
      </Card>

      {filtered.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((item) => (
            <Card key={item.id} interactive className="flex flex-col justify-between">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 shadow-soft">
                  {item.fileType?.startsWith('image/') ? <Image size={20} /> : <FileText size={20} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">{item.type} • {item.subject}</p>
                  <h3 className="mt-1 truncate font-display font-bold text-ink-100 text-base">{item.title}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <p className="text-xs text-ink-400 font-semibold">Uploaded {formatDate(item.createdAt)}</p>
                    <span className="inline-flex items-center gap-1 rounded-xl bg-bg-inset border border-line px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-ink-200">
                      {getFileExtension(item.url || item.fileUrl)} • {formatFileSize(item.fileSize)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2.5">
                <Button variant="secondary" onClick={() => window.open(item.url || item.fileUrl, '_blank', 'noopener,noreferrer')} disabled={!(item.url || item.fileUrl)}>
                  <Eye size={16} /> Preview
                </Button>
                <Button onClick={() => window.open(item.url || item.fileUrl, '_blank', 'noopener,noreferrer')} disabled={!(item.url || item.fileUrl)}>
                  <Download size={16} /> Open
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="Nothing matched" body="Clear the search input or switch categories to find resources." />
      )}
    </div>
  );
}

function formatDate(value) {
  const date = value?.toDate?.() || null;
  return date ? date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'just now';
}

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return 'Unknown size';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileExtension(url) {
  if (!url) return 'FILE';
  const match = url.match(/\.([0-9a-z]+)(?:[?#]|$)/i);
  return match ? match[1].toUpperCase() : 'FILE';
}
