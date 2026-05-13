export const subjects = [
  { id: 'csa', name: 'CSA', tone: 'bg-blue-500', progress: 76, strength: 'Computer architecture' },
  { id: 'c-language', name: 'C Language', tone: 'bg-slate-950 dark:bg-white dark:text-slate-950', progress: 68, strength: 'Pointers' },
  { id: 'mathematics', name: 'Mathematics', tone: 'bg-sky-500', progress: 82, strength: 'Matrices' },
  { id: 'statistics', name: 'Statistics', tone: 'bg-indigo-500', progress: 61, strength: 'Probability' },
  { id: 'cybersecurity', name: 'Cybersecurity', tone: 'bg-cyan-600', progress: 73, strength: 'Network security' },
];

export const mcqs = [
  {
    id: 1,
    subject: 'CSA',
    question: 'Which memory is closest to the CPU in the memory hierarchy?',
    options: ['Hard disk', 'RAM', 'Cache', 'Magnetic tape'],
    answer: 'Cache',
  },
  {
    id: 2,
    subject: 'C Language',
    question: 'Which operator is used to access the value at an address stored in a pointer?',
    options: ['&', '*', '->', '%'],
    answer: '*',
  },
  {
    id: 3,
    subject: 'Mathematics',
    question: 'The determinant of an identity matrix is always:',
    options: ['0', '1', '-1', 'Depends on order'],
    answer: '1',
  },
  {
    id: 4,
    subject: 'Statistics',
    question: 'The mean of deviations from the arithmetic mean is:',
    options: ['Always zero', 'Always one', 'Negative', 'Undefined'],
    answer: 'Always zero',
  },
  {
    id: 5,
    subject: 'Cybersecurity',
    question: 'Which practice helps prevent brute force login attacks?',
    options: ['Plain text passwords', 'Rate limiting', 'Open ports', 'Shared accounts'],
    answer: 'Rate limiting',
  },
];

export const quizzes = subjects.map((subject, index) => ({
  id: subject.id,
  title: `${subject.name} Sprint Quiz`,
  subject: subject.name,
  questions: 20,
  duration: 25,
  difficulty: index % 2 ? 'Intermediate' : 'Focused',
  attempts: 24 + index * 7,
}));

export const leaderboard = [
  { rank: 1, name: 'Aarav', score: 96, time: '14m 22s', streak: 18 },
  { rank: 2, name: 'Meera', score: 92, time: '15m 08s', streak: 15 },
  { rank: 3, name: 'Nandan', score: 89, time: '16m 41s', streak: 12 },
  { rank: 4, name: 'Isha', score: 84, time: '18m 04s', streak: 9 },
];

export const resources = [
  { id: 1, title: 'CSA PYQ Set 2024', subject: 'CSA', type: 'PYQ', format: 'PDF', date: 'May 10' },
  { id: 2, title: 'C Pointers Notes', subject: 'C Language', type: 'Notes', format: 'PDF', date: 'May 09' },
  { id: 3, title: 'Statistics Sample Paper 2', subject: 'Statistics', type: 'Sample Paper', format: 'PDF', date: 'May 08' },
  { id: 4, title: 'Cybersecurity Diagrams', subject: 'Cybersecurity', type: 'Notes', format: 'Image', date: 'May 07' },
];

export const activities = [
  'Completed Mathematics quiz with 82%',
  'Downloaded CSA PYQ Set 2024',
  'Moved to rank #3 this week',
  'Maintained 12 day study streak',
];

export const notifications = [
  { title: 'Daily quiz is live', body: '20 questions across CSA and C Language.', time: '8:00 AM' },
  { title: 'New notes uploaded', body: 'Cybersecurity module 3 notes are ready.', time: 'Yesterday' },
  { title: 'Exam countdown', body: '18 days left. Keep the streak warm.', time: 'May 10' },
];
