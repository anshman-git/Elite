// This file is kept for backward compatibility but subjects are now managed dynamically in Firestore
// The subjects are fetched in real-time from the 'subjects' collection

export const subjects = [
  { id: 'csa', name: 'CSA', tone: 'bg-blue-500', progress: 0, strength: 'Not started' },
  { id: 'c-language', name: 'C Language', tone: 'bg-slate-950 dark:bg-white dark:text-slate-950', progress: 0, strength: 'Not started' },
  { id: 'mathematics', name: 'Mathematics', tone: 'bg-sky-500', progress: 0, strength: 'Not started' },
  { id: 'statistics', name: 'Statistics', tone: 'bg-indigo-500', progress: 0, strength: 'Not started' },
  { id: 'cybersecurity', name: 'Cybersecurity', tone: 'bg-cyan-600', progress: 0, strength: 'Not started' },
];
