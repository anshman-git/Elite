import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  FilePlus2, 
  Plus, 
  Upload, 
  Download,
  UsersRound, 
  Edit, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff, 
  Star, 
  StarOff,
  Search,
  Filter,
  UserCheck,
  UserX,
  Crown,
  RotateCcw,
  BarChart3,
  BookOpen,
  Settings
} from 'lucide-react';
import { 
  createQuiz, 
  createResourceLink, 
  watchCollection, 
  watchQuizzes,
  updateQuiz,
  deleteQuiz,
  duplicateQuiz,
  createSubject,
  updateSubject,
  deleteSubject,
  watchSubjects,
  watchUsers,
  updateUser,
  banUser,
  unbanUser,
  promoteToAdmin,
  demoteFromAdmin,
  resetUserStreak,
  resetWeeklyLeaderboard,
  resetAllUserStats,
  giveWeeklyPoints,
  getUsersCount,
  getOnlineUsersCount
} from '../firebase';
import { deleteResource } from '../firebase';
import { Button, Card, Input, Select, Textarea } from '../components/ui';

const blankQuestion = {
  question: '',
  options: ['', '', '', ''],
  answer: '',
  explanation: '',
};

const PROGRESS_RING_RADIUS = 24;
const PROGRESS_RING_STROKE = 4;

function UploadProgressRing({ progress = 0, status = 'idle' }) {
  const normalized = Math.min(100, Math.max(0, progress));
  const circumference = 2 * Math.PI * PROGRESS_RING_RADIUS;
  const offset = circumference - (normalized / 100) * circumference;
  const color = status === 'success' ? '#22c55e' : status === 'error' ? '#ef4444' : '#38bdf8';

  return (
    <div className="inline-flex items-center gap-3 rounded-3xl bg-slate-50 px-3 py-2 text-left dark:bg-zinc-950">
      <svg width={58} height={58} viewBox="0 0 58 58" className="overflow-visible text-slate-200 dark:text-zinc-800">
        <circle
          cx="29"
          cy="29"
          r={PROGRESS_RING_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={PROGRESS_RING_STROKE}
        />
        <circle
          cx="29"
          cy="29"
          r={PROGRESS_RING_RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={PROGRESS_RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 29 29)"
          style={{ transition: 'stroke-dashoffset 0.45s ease, stroke 0.25s ease' }}
        />
      </svg>
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {status === 'success' ? 'Completed' : status === 'error' ? 'Failed' : `${normalized}%`}
        </p>
        <p className="text-xs text-slate-500 dark:text-zinc-400">
          {status === 'success' ? 'Upload status' : status === 'error' ? 'Try again' : 'Processing'}
        </p>
      </div>
    </div>
  );
}

export default function Admin({ notify, user }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [resource, setResource] = useState({
    title: '',
    subject: '',
    type: 'Notes',
    url: '',
  });
  const [quiz, setQuiz] = useState({
    title: '',
    subject: '',
    timerMinutes: 25,
    published: true,
    dailyQuiz: false,
    weeklyTest: false,
    questions: [blankQuestion],
  });
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [quizFile, setQuizFile] = useState(null);
  const [resourceSaveState, setResourceSaveState] = useState('idle');
  const [resourceDropState, setResourceDropState] = useState('idle');
  const [resourceDropHint, setResourceDropHint] = useState('');
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [quizUploadProgress, setQuizUploadProgress] = useState(0);
  const [quizUploadSummary, setQuizUploadSummary] = useState({ success: 0, warnings: 0 });
  const [busy, setBusy] = useState('');
  const [existingQuizzes, setExistingQuizzes] = useState([]);
  const [existingResources, setExistingResources] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    onlineUsers: 0,
    totalQuizzes: 0,
    totalResources: 0,
    subjectsCount: 0,
    dailyQuiz: null,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [newSubject, setNewSubject] = useState({ name: '', description: '' });
  const [editingSubject, setEditingSubject] = useState(null);

  async function loadAnalytics() {
    try {
      const [totalUsers, onlineUsers] = await Promise.all([
        getUsersCount(),
        getOnlineUsersCount(),
      ]);

      const dailyQuiz = existingQuizzes.find(q => q.dailyQuiz) || null;

      setAnalytics({
        totalUsers,
        onlineUsers,
        totalQuizzes: existingQuizzes.length,
        totalResources: existingResources.length,
        subjectsCount: subjects.length,
        dailyQuiz,
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  }

  useEffect(() => {
    if (!user) return () => {};

    const unsubscribers = [];

    // Quizzes
    unsubscribers.push(watchQuizzes(setExistingQuizzes, {
      take: 100,
      onError: (error) => console.error('Failed to load quizzes:', error),
    }));

    // Resources
    const handleResources = (items) => {
      setExistingResources(items);
      setResourcesLoading(false);
    };

    unsubscribers.push(watchCollection('resources', handleResources, {
      take: 100,
      onError: (error) => {
        console.error('Failed to load resources:', error);
        setResourcesLoading(false);
      },
    }));

    // Subjects
    unsubscribers.push(watchSubjects(setSubjects, {
      take: 100,
      onError: (error) => console.error('Failed to load subjects:', error),
    }));

    // Users
    unsubscribers.push(watchUsers(setUsers, {
      take: 200,
      onError: (error) => console.error('Failed to load users:', error),
    }));

    return () => unsubscribers.forEach(unsub => unsub?.());
  }, [user]);

  useEffect(() => {
    const id = setTimeout(() => { loadAnalytics(); }, 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingQuizzes, existingResources, subjects, users]);

  const handleDropZoneDrag = (event) => {
    event.preventDefault();
    setResourceDropState('active');
  };

  const handleDropZoneLeave = () => {
    setResourceDropState('idle');
  };

  const handleDropZoneDrop = (event) => {
    event.preventDefault();
    setResourceDropState('idle');
    const plainText = event.dataTransfer.getData('text/plain') || event.dataTransfer.getData('text/uri-list');
    if (event.dataTransfer.files?.length > 0) {
      setResourceDropHint('Local files are not supported here. Paste a public hosted URL instead.');
      return;
    }

    const normalizedUrl = parseHostUrl(plainText);
    if (!normalizedUrl) {
      setResourceDropHint('Drop a public link or paste a valid hosted URL.');
      return;
    }

    setResource((current) => ({ ...current, url: normalizedUrl }));
    setResourceDropHint('Link detected — ready to save.');
  };

  function parseHostUrl(value) {
    try {
      const trimmed = value?.toString().trim();
      if (!trimmed) return null;
      const parsed = new URL(trimmed);
      if (!['http:', 'https:'].includes(parsed.protocol)) return null;
      return parsed.toString();
    } catch {
      return null;
    }
  }

  async function submitResource(event) {
    event.preventDefault();
    const normalizedUrl = parseHostUrl(resource.url);
    if (!normalizedUrl) {
      notify('Paste a valid public file URL (Google Drive, GitHub raw, Dropbox, etc.).');
      setResourceDropHint('Looks like the URL is malformed. Try again with a hosted link.');
      return;
    }
    if (!resource.subject) {
      notify('Select a subject for the resource.');
      return;
    }
    setBusy('resource');
    setResourceSaveState('saving');
    setResourceDropHint('');
    try {
      await createResourceLink({
        title: resource.title,
        subject: resource.subject,
        type: resource.type,
        url: normalizedUrl,
        createdBy: user?.uid,
      });
      notify('Resource link saved successfully.');
      setResource({ title: '', subject: '', type: 'Notes', url: '' });
      setResourceSaveState('success');
      setTimeout(() => setResourceSaveState('idle'), 1400);
    } catch (error) {
      console.error('Resource save failed:', error);
      notify(error.message || 'Could not save resource link.');
      setResourceSaveState('error');
      setTimeout(() => setResourceSaveState('idle'), 1400);
    } finally {
      setBusy('');
    }
  }

  async function handleDeleteResource(resourceId) {
    if (!window.confirm('Delete this resource? This cannot be undone.')) return;
    setBusy(`delete-resource-${resourceId}`);
    try {
      await deleteResource(resourceId);
      notify('Resource deleted.');
    } catch (error) {
      notify('Failed to delete resource.');
    } finally {
      setBusy('');
    }
  }

  async function submitQuiz(event) {
    event.preventDefault();
    const cleanQuestions = quiz.questions
      .map((item) => ({
        ...item,
        options: item.options.map((option) => option.trim()).filter(Boolean),
        question: item.question.trim(),
        answer: item.answer.trim(),
        explanation: item.explanation.trim(),
      }))
      .filter((item) => item.question && item.answer && item.options.length >= 2);

    if (!quiz.title.trim() || !quiz.subject || cleanQuestions.length === 0) {
      notify('Add a quiz title, subject, and at least one complete MCQ.');
      return;
    }

    setBusy('quiz');
    try {
      if (editingQuiz) {
        await updateQuiz(editingQuiz.id, {
          title: quiz.title.trim(),
          subject: quiz.subject,
          timerMinutes: Number(quiz.timerMinutes),
          published: quiz.published,
          dailyQuiz: quiz.dailyQuiz,
          weeklyTest: quiz.weeklyTest,
          questions: cleanQuestions,
        });
        notify('Quiz updated successfully.');
        setEditingQuiz(null);
      } else {
        await createQuiz({
          title: quiz.title.trim(),
          subject: quiz.subject,
          timerMinutes: Number(quiz.timerMinutes),
          published: quiz.published,
          dailyQuiz: quiz.dailyQuiz,
          weeklyTest: quiz.weeklyTest,
          questions: cleanQuestions,
          createdBy: user?.uid || null,
        });
        notify('Quiz created successfully.');
      }
      setQuiz({ title: '', subject: '', timerMinutes: 25, published: true, dailyQuiz: false, weeklyTest: false, questions: [blankQuestion] });
      setShowQuizForm(false);
      setEditingQuiz(null);
    } catch (error) {
      notify(error.message || 'Failed to save quiz.');
    } finally {
      setBusy('');
    }
  }

  async function handleEditQuiz(quizItem) {
    setEditingQuiz(quizItem);
    setShowQuizForm(true);
    setQuiz({
      title: quizItem.title,
      subject: quizItem.subject,
      timerMinutes: quizItem.timerMinutes || 25,
      published: quizItem.published ?? true,
      dailyQuiz: quizItem.dailyQuiz ?? false,
      weeklyTest: quizItem.weeklyTest ?? false,
      questions: quizItem.questions || [blankQuestion],
    });
    setActiveTab('quizzes');
  }

  async function handleDeleteQuiz(quizId) {
    if (!window.confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) return;
    
    setBusy(`delete-${quizId}`);
    try {
      await deleteQuiz(quizId);
      notify('Quiz deleted successfully.');
    } catch (error) {
      notify('Failed to delete quiz.');
    } finally {
      setBusy('');
    }
  }

  async function handleDuplicateQuiz(quizId) {
    setBusy(`duplicate-${quizId}`);
    try {
      await duplicateQuiz(quizId);
      notify('Quiz duplicated successfully.');
    } catch (error) {
      notify('Failed to duplicate quiz.');
    } finally {
      setBusy('');
    }
  }

  async function handleTogglePublish(quizId, currentPublished) {
    setBusy(`publish-${quizId}`);
    try {
      await updateQuiz(quizId, { published: !currentPublished });
      notify(`Quiz ${!currentPublished ? 'published' : 'unpublished'}.`);
    } catch (error) {
      notify('Failed to update quiz status.');
    } finally {
      setBusy('');
    }
  }

  async function handleToggleDaily(quizId, currentDaily) {
    // Ensure only one daily quiz
    if (!currentDaily) {
      const currentDailyQuiz = existingQuizzes.find(q => q.dailyQuiz && q.id !== quizId);
      if (currentDailyQuiz) {
        await updateQuiz(currentDailyQuiz.id, { dailyQuiz: false });
      }
    }

    setBusy(`daily-${quizId}`);
    try {
      await updateQuiz(quizId, { dailyQuiz: !currentDaily });
      notify(`Quiz ${!currentDaily ? 'marked as daily' : 'unmarked as daily'}.`);
    } catch (error) {
      notify('Failed to update daily quiz status.');
    } finally {
      setBusy('');
    }
  }

  async function submitQuizFile(event) {
    event.preventDefault();
    if (!quizFile) {
      notify('Choose a JSON file containing quiz data.');
      return;
    }

    setBusy('quizFile');
    setQuizUploadProgress(0);
    setQuizUploadSummary({ success: 0, warnings: 0 });
    try {
      const text = await quizFile.text();
      const quizData = JSON.parse(text);

      if (!Array.isArray(quizData)) {
        throw new Error('Quiz file must contain an array of quizzes.');
      }

      let uploadedCount = 0;
      let processedCount = 0;
      for (const quiz of quizData) {
        processedCount += 1;
        const totalCount = quizData.length;
        setQuizUploadProgress(Math.round((processedCount / totalCount) * 100));

        if (!quiz.title || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
          console.warn('Skipping invalid quiz:', quiz);
          continue;
        }

        const cleanQuestions = quiz.questions
          .map((item) => ({
            ...item,
            options: item.options?.map((option) => option?.trim()).filter(Boolean) || [],
            question: item.question?.trim() || '',
            answer: item.answer?.trim() || '',
            explanation: item.explanation?.trim() || '',
          }))
          .filter((item) => item.question && item.answer && item.options.length >= 2);

        if (cleanQuestions.length === 0) continue;

        await createQuiz({
          title: quiz.title.trim(),
          subject: quiz.subject || 'General',
          timerMinutes: Number(quiz.timerMinutes) || Number(quiz.duration) || 25,
          published: quiz.published ?? true,
          dailyQuiz: quiz.dailyQuiz ?? false,
          weeklyTest: quiz.weeklyTest ?? false,
          questions: cleanQuestions,
          createdBy: user?.uid || null,
        });
        uploadedCount++;
      }

      setQuizUploadProgress(100);
      setQuizUploadSummary((current) => ({ ...current, success: uploadedCount }));
      notify(`Successfully uploaded ${uploadedCount} quiz(es).`);
      setQuizFile(null);
      event.currentTarget.reset();
    } catch (error) {
      notify(error.message || 'Failed to upload quiz file. Check the JSON format.');
    } finally {
      setBusy('');
    }
  }

  async function submitSubject(event) {
    event.preventDefault();
    const subjectName = newSubject.name.trim();
    if (!subjectName) {
      notify('Enter a subject name.');
      return;
    }

    const duplicateSubject = subjects.find((subject) =>
      subject.name?.toLowerCase() === subjectName.toLowerCase() &&
      (!editingSubject || subject.id !== editingSubject.id)
    );

    if (duplicateSubject) {
      notify('A subject with this name already exists.');
      return;
    }

    setBusy('subject');
    try {
      if (editingSubject) {
        await updateSubject(editingSubject.id, {
          name: subjectName,
          description: newSubject.description.trim(),
        });
        notify('Subject updated successfully.');
        setEditingSubject(null);
      } else {
        await createSubject({
          name: subjectName,
          description: newSubject.description.trim(),
          createdBy: user?.uid,
        });
        notify('Subject created successfully.');
      }
      setNewSubject({ name: '', description: '' });
    } catch (error) {
      notify('Failed to save subject.');
    } finally {
      setBusy('');
    }
  }

  async function handleDeleteSubject(subjectId) {
    if (!window.confirm('Are you sure you want to delete this subject? This will affect existing quizzes and resources.')) return;
    
    setBusy(`delete-subject-${subjectId}`);
    try {
      const subjectToDelete = subjects.find(s => s.id === subjectId);
      await deleteSubject(subjectId);
      notify('Subject deleted successfully.');
      
      if (subjectToDelete) {
        if (resource.subject === subjectToDelete.name) {
          setResource((current) => ({ ...current, subject: '' }));
        }
        if (quiz.subject === subjectToDelete.name) {
          setQuiz((current) => ({ ...current, subject: '' }));
        }
      }
    } catch (error) {
      notify('Failed to delete subject.');
    } finally {
      setBusy('');
    }
  }

  async function handleUserAction(userId, action) {
    setBusy(`user-${action}-${userId}`);
    try {
      switch (action) {
        case 'ban':
          await banUser(userId);
          notify('User banned successfully.');
          break;
        case 'unban':
          await unbanUser(userId);
          notify('User unbanned successfully.');
          break;
        case 'promote':
          await promoteToAdmin(userId);
          notify('User promoted to admin.');
          break;
        case 'demote':
          await demoteFromAdmin(userId);
          notify('User demoted from admin.');
          break;
        case 'reset-streak':
          await resetUserStreak(userId);
          notify('User streak reset successfully.');
          break;
      }
    } catch (error) {
      notify('Failed to perform user action.');
    } finally {
      setBusy('');
    }
  }

  function updateQuestion(index, patch) {
    setQuiz((current) => ({
      ...current,
      questions: current.questions.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    }));
  }

  function updateOption(questionIndex, optionIndex, value) {
    setQuiz((current) => ({
      ...current,
      questions: current.questions.map((item, itemIndex) => {
        if (itemIndex !== questionIndex) return item;
        return {
          ...item,
          options: item.options.map((option, index) => (index === optionIndex ? value : option)),
        };
      }),
    }));
  }

  const filteredQuizzes = existingQuizzes.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = !filterSubject || quiz.subject === filterSubject;
    return matchesSearch && matchesSubject;
  });

  const filteredUsers = users.filter(user => {
    const searchLower = userSearchTerm.toLowerCase();
    return user.name?.toLowerCase().includes(searchLower) || 
           user.email?.toLowerCase().includes(searchLower) ||
           user.role?.toLowerCase().includes(searchLower);
  });

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'quizzes', label: 'Quiz Management', icon: BookOpen },
    { id: 'subjects', label: 'Subjects', icon: Settings },
    { id: 'users', label: 'User Management', icon: UsersRound },
    { id: 'resources', label: 'Resources', icon: Upload },
  ];



  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Admin Panel</p>
        <h2 className="text-2xl font-black text-slate-950 dark:text-white">Management Dashboard</h2>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4 dark:border-white/10">
        {tabs.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant={activeTab === id ? 'accent' : 'ghost'}
            onClick={() => setActiveTab(id)}
            className="flex items-center gap-2"
          >
            <Icon size={16} />
            {label}
          </Button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Analytics Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Metric value={analytics.totalUsers} label="Total Users" icon={UsersRound} />
            <Metric value={analytics.onlineUsers} label="Online Users" icon={UserCheck} />
            <Metric value={analytics.totalQuizzes} label="Total Quizzes" icon={BookOpen} />
            <Metric value={analytics.subjectsCount} label="Subjects" icon={Settings} />
            <Metric value={analytics.totalResources} label="Resources" icon={Upload} />
            <Metric value={analytics.dailyQuiz ? 'Set' : 'Not Set'} label="Daily Quiz" icon={Star} />
          </div>

          {/* Recent Activity */}
          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <h3 className="font-black text-slate-950 dark:text-white">Recent Quizzes</h3>
              <div className="mt-4 space-y-3">
                {existingQuizzes.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
                    <div>
                      <p className="font-bold text-slate-950 dark:text-white">{item.title}</p>
                      <p className="text-sm text-slate-500">{item.subject} • {item.questions?.length || 0} questions</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.dailyQuiz && <Star size={14} className="text-yellow-500" />}
                      {item.published ? <Eye size={14} className="text-green-500" /> : <EyeOff size={14} className="text-red-500" />}
                    </div>
                  </div>
                ))}
                {existingQuizzes.length === 0 && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No quizzes created yet.</p>
                )}
              </div>
            </Card>

            <Card>
              <h3 className="font-black text-slate-950 dark:text-white">Recent Users</h3>
              <div className="mt-4 space-y-3">
                {users.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
                    <div>
                      <p className="font-bold text-slate-950 dark:text-white">{item.name}</p>
                      <p className="text-sm text-slate-500">{item.email} • {item.role}</p>
                    </div>
                    <div className="text-xs text-slate-400">
                      Streak: {item.streak || 0}
                    </div>
                  </div>
                ))}
                {users.length === 0 && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No users registered yet.</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Quiz Management Tab */}
      {activeTab === 'quizzes' && (
        <div className="space-y-6">
          {/* Quiz List with Filters */}
          <Card>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="font-black text-slate-950 dark:text-white">Quiz Management</h3>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search quizzes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="min-h-10 rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-semibold outline-none transition focus:border-blue-400 dark:border-white/10 dark:bg-slate-950"
                  />
                </div>
                <select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  className="min-h-10 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-blue-400 dark:border-white/10 dark:bg-slate-950"
                >
                  <option value="">All Subjects</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.name}>{subject.name}</option>
                  ))}
                </select>
                <Button onClick={() => { setEditingQuiz(null); setShowQuizForm(true); setActiveTab('quizzes'); }} className="whitespace-nowrap">
                  <Plus size={16} /> Create Quiz
                </Button>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {filteredQuizzes.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 dark:border-white/10">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-950 dark:text-white">{item.title}</p>
                      {item.dailyQuiz && <Star size={14} className="text-yellow-500" />}
                      {item.published ? <Eye size={14} className="text-green-500" /> : <EyeOff size={14} className="text-red-500" />}
                    </div>
                    <p className="text-sm text-slate-500">{item.subject} • {item.questions?.length || 0} questions • {item.timerMinutes}min</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTogglePublish(item.id, item.published)}
                      disabled={busy === `publish-${item.id}`}
                    >
                      {item.published ? <EyeOff size={14} /> : <Eye size={14} />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleDaily(item.id, item.dailyQuiz)}
                      disabled={busy === `daily-${item.id}`}
                    >
                      {item.dailyQuiz ? <StarOff size={14} /> : <Star size={14} />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditQuiz(item)}
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicateQuiz(item.id)}
                      disabled={busy === `duplicate-${item.id}`}
                    >
                      <Copy size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteQuiz(item.id)}
                      disabled={busy === `delete-${item.id}`}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
              {filteredQuizzes.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400">No quizzes found.</p>
              )}
            </div>
          </Card>

          {/* Create/Edit Quiz Form */}
          {(showQuizForm || editingQuiz) && (
            <Card>
              <div className="flex items-center gap-3">
                {editingQuiz ? <Edit className="text-blue-600" /> : <Plus className="text-blue-600" />}
                <h3 className="font-black text-slate-950 dark:text-white">
                  {editingQuiz ? 'Edit Quiz' : 'Create Quiz'}
                </h3>
              </div>
              <form onSubmit={submitQuiz} className="mt-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input label="Quiz title" value={quiz.title} onChange={(value) => setQuiz({ ...quiz, title: value })} placeholder="Daily Mixed MCQ" />
                  <Select label="Subject" value={quiz.subject} onChange={(value) => setQuiz({ ...quiz, subject: value })}>
                    <option value="">Select Subject</option>
                    {subjects.map((subject) => <option key={subject.id} value={subject.name}>{subject.name}</option>)}
                  </Select>
                  <Input label="Timer minutes" type="number" value={quiz.timerMinutes} onChange={(value) => setQuiz({ ...quiz, timerMinutes: value })} />
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={quiz.published}
                        onChange={(event) => setQuiz({ ...quiz, published: event.target.checked })}
                        className="h-4 w-4 accent-blue-600"
                      />
                      Published
                    </label>
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={quiz.dailyQuiz}
                        onChange={(event) => setQuiz({ ...quiz, dailyQuiz: event.target.checked })}
                        className="h-4 w-4 accent-blue-600"
                      />
                      Daily Quiz
                    </label>
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={quiz.weeklyTest}
                        onChange={(event) => setQuiz((prev) => ({ ...prev, weeklyTest: event.target.checked }))}
                        className="h-4 w-4 accent-blue-600"
                      />
                      Weekly Test
                    </label>
                  </div>
                </div>

                {quiz.questions.map((item, questionIndex) => (
                  <div key={questionIndex} className="rounded-2xl border border-slate-200 p-3 dark:border-white/10">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-600">MCQ {questionIndex + 1}</p>
                    <div className="mt-3 grid gap-3">
                      <Textarea
                        label="Question"
                        value={item.question}
                        onChange={(value) => updateQuestion(questionIndex, { question: value })}
                        placeholder="Write the question"
                      />
                      <div className="grid gap-2 sm:grid-cols-2">
                        {item.options.map((option, optionIndex) => (
                          <Input
                            key={optionIndex}
                            label={`Option ${optionIndex + 1}`}
                            value={option}
                            onChange={(value) => updateOption(questionIndex, optionIndex, value)}
                            placeholder={`Option ${optionIndex + 1}`}
                          />
                        ))}
                      </div>
                      <Input
                        label="Correct answer"
                        value={item.answer}
                        onChange={(value) => updateQuestion(questionIndex, { answer: value })}
                        placeholder="Must match one option"
                      />
                      <Textarea
                        label="Explanation"
                        value={item.explanation}
                        onChange={(value) => updateQuestion(questionIndex, { explanation: value })}
                        placeholder="Short explanation shown after submission"
                      />
                    </div>
                  </div>
                ))}

                <div className="grid gap-2 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setQuiz((current) => ({ ...current, questions: [...current.questions, blankQuestion] }))}
                  >
                    <Plus size={17} /> Add another MCQ
                  </Button>
                  <Button variant="primary" disabled={busy === 'quiz'}>
                    {busy === 'quiz' ? 'Saving...' : editingQuiz ? 'Update Quiz' : 'Create Quiz'}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Bulk Upload */}
          <Card>
            <div className="flex items-center gap-3">
              <Upload className="text-blue-600" />
              <h3 className="font-black text-slate-950 dark:text-white">Bulk upload quizzes</h3>
            </div>
            <form onSubmit={submitQuizFile} className="mt-4 grid gap-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Upload a JSON file containing multiple quizzes. Each quiz should have title, subject, timerMinutes, published, dailyQuiz, and questions array.
              </p>
              <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                Quiz JSON file
                <input
                  type="file"
                  accept="application/json"
                  onChange={(event) => setQuizFile(event.target.files?.[0] || null)}
                  className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold dark:border-white/10 dark:bg-slate-950"
                />
              </label>
              <Button variant="primary" disabled={busy === 'quizFile'} className="w-full">
                <Upload size={17} /> {busy === 'quizFile' ? 'Uploading...' : 'Upload quizzes'}
              </Button>
              <AnimatePresence mode="wait">
                {(busy === 'quizFile' || quizUploadProgress > 0) && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="mt-4 grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <UploadProgressRing
                      progress={quizUploadProgress}
                      status={busy === 'quizFile' ? 'uploading' : quizUploadSummary.success > 0 ? 'success' : 'idle'}
                    />
                    {quizUploadSummary.success > 0 && (
                      <p className="text-sm text-slate-500 dark:text-zinc-400">
                        {quizUploadSummary.success} quiz(es) added from the uploaded file.
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </Card>
        </div>
      )}

      {/* Subjects Tab */}
      {activeTab === 'subjects' && (
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-950 dark:text-white">Subject Management</h3>
              <Button onClick={() => { setEditingSubject(null); setNewSubject({ name: '', description: '' }); }}>
                <Plus size={16} /> Add Subject
              </Button>
            </div>
            <div className="mt-4 space-y-3">
              {subjects.map((subject) => (
                <div key={subject.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 dark:border-white/10">
                  <div>
                    <p className="font-bold text-slate-950 dark:text-white">{subject.name}</p>
                    <p className="text-sm text-slate-500">{subject.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setEditingSubject(subject); setNewSubject({ name: subject.name, description: subject.description || '' }); }}
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSubject(subject.id)}
                      disabled={busy === `delete-subject-${subject.id}`}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
              {subjects.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400">No subjects created yet.</p>
              )}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              {editingSubject ? <Edit className="text-blue-600" /> : <Plus className="text-blue-600" />}
              <h3 className="font-black text-slate-950 dark:text-white">
                {editingSubject ? 'Edit Subject' : 'Add New Subject'}
              </h3>
            </div>
            <form onSubmit={submitSubject} className="mt-4 grid gap-3">
              <Input
                label="Subject Name"
                value={newSubject.name}
                onChange={(value) => setNewSubject({ ...newSubject, name: value })}
                placeholder="Computer Science"
              />
              <Textarea
                label="Description (Optional)"
                value={newSubject.description}
                onChange={(value) => setNewSubject({ ...newSubject, description: value })}
                placeholder="Brief description of the subject"
              />
              <Button variant="primary" disabled={busy === 'subject'}>
                {busy === 'subject' ? 'Saving...' : editingSubject ? 'Update Subject' : 'Create Subject'}
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* User Management Tab */}
      {activeTab === 'users' && (
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-black text-slate-950 dark:text-white">User Management</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Weekly leaderboard resets are available for admins.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {user?.role === 'admin' && (
                <>
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      if (!window.confirm('Reset weekly leaderboard points for all users? This cannot be undone.')) return;
                      setBusy('reset-weekly');
                      try {
                        await resetWeeklyLeaderboard();
                        notify('Weekly leaderboard reset successfully.');
                      } catch (error) {
                        notify('Failed to reset weekly leaderboard.');
                      } finally {
                        setBusy('');
                      }
                    }}
                    disabled={busy === 'reset-weekly' || busy === 'reset-all' || busy === 'debug-weekly'}
                  >
                    Reset weekly leaderboard
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      if (!window.confirm('RESET ALL USER SCORES AND STATS? This cannot be undone. Points, weekly points, attempts, and streaks will be reset to zero for ALL users.')) return;
                      setBusy('reset-all');
                      try {
                        await resetAllUserStats();
                        notify('All user stats reset successfully.');
                      } catch (error) {
                        notify('Failed to reset all user stats.');
                      } finally {
                        setBusy('');
                      }
                    }}
                    disabled={busy === 'reset-all' || busy === 'reset-weekly' || busy === 'debug-weekly'}
                  >
                    Reset All Scores
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      if (!user?.uid) return;
                      setBusy('debug-weekly');
                      try {
                        await giveWeeklyPoints(user.uid, 100);
                        notify('Added 100 weekly points to your account for debug testing.');
                      } catch (error) {
                        notify('Failed to add debug weekly points.');
                      } finally {
                        setBusy('');
                      }
                    }}
                    disabled={busy === 'debug-weekly' || busy === 'reset-weekly' || busy === 'reset-all'}
                  >
                    Give Weekly Points +100
                  </Button>
                </>
              )}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="min-h-10 rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-semibold outline-none transition focus:border-blue-400 dark:border-white/10 dark:bg-slate-950"
                />
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {filteredUsers.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 dark:border-white/10">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-950 dark:text-white">{item.name}</p>
                    {item.role === 'admin' && <Crown size={14} className="text-yellow-500" />}
                    {item.banned && <UserX size={14} className="text-red-500" />}
                  </div>
                  <p className="text-sm text-slate-500">{item.email} • Role: {item.role} • Streak: {item.streak || 0} • Score: {item.points || 0}</p>
                  <p className="text-xs text-slate-400">
                    Joined: {item.createdAt?.toDate?.()?.toLocaleDateString()} • 
                    Last Active: {item.lastActiveAt?.toDate?.()?.toLocaleDateString() || 'Never'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {item.banned ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUserAction(item.id, 'unban')}
                      disabled={busy === `user-unban-${item.id}`}
                      className="text-green-600 hover:text-green-700"
                    >
                      <UserCheck size={14} />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUserAction(item.id, 'ban')}
                      disabled={busy === `user-ban-${item.id}`}
                      className="text-red-600 hover:text-red-700"
                    >
                      <UserX size={14} />
                    </Button>
                  )}
                  {item.role === 'admin' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUserAction(item.id, 'demote')}
                      disabled={busy === `user-demote-${item.id}`}
                    >
                      <Crown size={14} className="text-gray-500" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUserAction(item.id, 'promote')}
                      disabled={busy === `user-promote-${item.id}`}
                      className="text-yellow-600 hover:text-yellow-700"
                    >
                      <Crown size={14} />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUserAction(item.id, 'reset-streak')}
                    disabled={busy === `user-reset-streak-${item.id}`}
                  >
                    <RotateCcw size={14} />
                  </Button>
                </div>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">No users found.</p>
            )}
          </div>
        </Card>
      )}

      {/* Resources Tab */}
      {activeTab === 'resources' && (
        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-3">
              <Upload className="text-blue-600" />
              <h3 className="font-black text-slate-950 dark:text-white">Add resource link</h3>
            </div>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Host files on Google Drive, GitHub, or Dropbox, then paste the public link here.
            </p>
            <form onSubmit={submitResource} className="mt-4 grid gap-3">
              <Input
                label="Title"
                value={resource.title}
                onChange={(value) => setResource({ ...resource, title: value })}
                placeholder="CSA PYQ Set 2025"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Select label="Subject" value={resource.subject} onChange={(value) => setResource({ ...resource, subject: value })}>
                  <option value="">Select Subject</option>
                  {subjects.map((subject) => <option key={subject.id} value={subject.name}>{subject.name}</option>)}
                </Select>
                <Select label="Type" value={resource.type} onChange={(value) => setResource({ ...resource, type: value })}>
                  <option>PYQ</option>
                  <option>Notes</option>
                  <option>Sample Paper</option>
                </Select>
              </div>
              <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-zinc-300">
                File URL
                <div
                  role="button"
                  tabIndex={0}
                  onDragOver={handleDropZoneDrag}
                  onDragEnter={handleDropZoneDrag}
                  onDragLeave={handleDropZoneLeave}
                  onDrop={handleDropZoneDrop}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setResourceDropHint('Paste a public hosted URL here.');
                    }
                  }}
                  className={`min-h-[5rem] rounded-3xl border px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${resourceDropState === 'active' ? 'border-blue-500 bg-blue-50/70 dark:border-amber-400 dark:bg-amber-500/10' : 'border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-950'}`}
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-slate-500 dark:text-zinc-400">{resource.url || 'Drop a hosted URL here or paste one.'}</span>
                      <span className="rounded-full border border-slate-200 px-2 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:border-zinc-700 dark:text-zinc-400">
                        Link drop zone
                      </span>
                    </div>
                    <Input
                      value={resource.url}
                      onChange={(value) => setResource({ ...resource, url: value })}
                      placeholder="https://drive.google.com/... or https://raw.githubusercontent.com/..."
                      className="bg-transparent px-0 py-0 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-zinc-500"
                    />
                  </div>
                </div>
                <span className="text-xs text-slate-400">
                  Drag a public link over this zone or paste the URL. Local files are not supported.
                </span>
                {resourceDropHint && <p className="text-xs text-rose-500">{resourceDropHint}</p>}
              </label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button type="submit" variant="primary" disabled={busy === 'resource'} className="w-full sm:w-auto">
                  <Upload size={17} /> {busy === 'resource' ? 'Saving...' : 'Save resource link'}
                </Button>
                <AnimatePresence mode="wait">
                  {resourceSaveState !== 'idle' && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="rounded-3xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                    >
                      {resourceSaveState === 'saving' ? 'Saving resource…' : resourceSaveState === 'success' ? 'Saved successfully' : 'Failed to save.'}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </form>
          </Card>

          <Card>
            <h3 className="font-black text-slate-950 dark:text-white">Recent Resources</h3>
            <div className="mt-4">
              {resourcesLoading ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-32 animate-pulse rounded-3xl bg-slate-100 dark:bg-zinc-900" />
                  ))}
                </div>
              ) : existingResources.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {existingResources.slice(0, 10).map((item) => (
                    <Card key={item.id} interactive className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-slate-950 dark:text-white">{item.title}</p>
                          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">{item.subject} · {item.type}</p>
                          <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-400 dark:text-zinc-500">{item.createdAt?.toDate?.()?.toLocaleDateString() || 'Recent'}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">{item.type}</div>
                          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400">
                            <Upload size={12} />
                            <span>{item.createdAt?.toDate?.()?.toLocaleDateString() || 'No date'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(item.url || item.fileUrl, '_blank', 'noopener,noreferrer')}
                          disabled={!(item.url || item.fileUrl)}
                        >
                          <Eye size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(item.url || item.fileUrl, '_blank', 'noopener,noreferrer')}
                          disabled={!(item.url || item.fileUrl)}
                        >
                          <Download size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteResource(item.id)}
                          disabled={busy === `delete-resource-${item.id}`}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center dark:border-zinc-800 dark:bg-zinc-950">
                  <p className="font-semibold text-slate-900 dark:text-white">No resources uploaded yet.</p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">Use the link drop zone above to add your first file resource.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      </div>
  );
}

function Metric({ icon: Icon, label, value, urgent }) {
  return (
    <Card className={`p-4 ${urgent ? 'ring-2 ring-red-500/50 bg-red-50/50 dark:bg-red-500/5' : ''}`}>
      <Icon className={`text-blue-600 ${urgent ? 'text-red-600' : ''}`} size={21} />
      <p className={`mt-3 text-xs font-bold uppercase tracking-[0.12em] ${urgent ? 'text-red-600' : 'text-slate-400'}`}>{label}</p>
      <p className={`mt-1 text-xl font-black ${urgent ? 'text-red-600' : 'text-slate-950 dark:text-white'}`}>{value}</p>
    </Card>
  );
}
