import { useState, useEffect } from 'react';
import { 
  FilePlus2, 
  Megaphone, 
  Plus, 
  Send, 
  Upload, 
  UsersRound, 
  Edit, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff, 
  Star, 
  StarOff,
  Clock,
  Search,
  Filter,
  UserCheck,
  UserX,
  Crown,
  RotateCcw,
  BarChart3,
  BookOpen,
  Timer,
  Settings
} from 'lucide-react';
import { 
  createAnnouncement, 
  createQuiz, 
  uploadResource, 
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
  getUsersCount,
  getOnlineUsersCount,
  updateExamCountdown,
  getExamCountdown,
  watchExamCountdown
} from '../firebase';
import { Button, Card } from '../components/ui';

const blankQuestion = {
  question: '',
  options: ['', '', '', ''],
  answer: '',
  explanation: '',
};

export default function Admin({ notify, user }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [resource, setResource] = useState({
    title: '',
    subject: '',
    type: 'Notes',
    file: null,
  });
  const [quiz, setQuiz] = useState({
    title: '',
    subject: '',
    timerMinutes: 25,
    published: true,
    dailyQuiz: false,
    questions: [blankQuestion],
  });
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [quizFile, setQuizFile] = useState(null);
  const [announcement, setAnnouncement] = useState({ title: '', body: '', target: 'all' });
  const [busy, setBusy] = useState('');
  const [existingQuizzes, setExistingQuizzes] = useState([]);
  const [existingResources, setExistingResources] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [examCountdown, setExamCountdown] = useState(null);
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
  const [examTimer, setExamTimer] = useState({ title: '', examDate: '' });

  useEffect(() => {
    const unsubscribers = [];

    // Quizzes
    unsubscribers.push(watchQuizzes(setExistingQuizzes, {
      take: 100,
      onError: (error) => console.error('Failed to load quizzes:', error),
    }));

    // Resources
    unsubscribers.push(watchCollection('resources', setExistingResources, {
      take: 100,
      onError: (error) => console.error('Failed to load resources:', error),
    }));

    // Subjects
    unsubscribers.push(watchSubjects(setSubjects, {
      take: 50,
      onError: (error) => console.error('Failed to load subjects:', error),
    }));

    // Users
    unsubscribers.push(watchUsers(setUsers, {
      take: 200,
      onError: (error) => console.error('Failed to load users:', error),
    }));

    // Exam countdown
    unsubscribers.push(watchExamCountdown(setExamCountdown));

    return () => unsubscribers.forEach(unsub => unsub?.());
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [existingQuizzes, existingResources, subjects, users]);

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

  async function submitResource(event) {
    event.preventDefault();
    if (!resource.file) {
      notify('Choose a PDF or image before uploading.');
      return;
    }
    if (!resource.subject) {
      notify('Select a subject for the resource.');
      return;
    }
    setBusy('resource');
    try {
      await uploadResource({
        ...resource,
        title: resource.title || resource.file.name,
        createdBy: user?.uid,
      });
      notify('Resource uploaded successfully.');
      setResource({ title: '', subject: '', type: 'Notes', file: null });
      event.currentTarget.reset();
    } catch (error) {
      notify(error.message || 'Connect Firebase to upload files.');
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
          questions: cleanQuestions,
          createdBy: user?.uid || null,
        });
        notify('Quiz created successfully.');
      }
      setQuiz({ title: '', subject: '', timerMinutes: 25, published: true, dailyQuiz: false, questions: [blankQuestion] });
    } catch (error) {
      notify(error.message || 'Failed to save quiz.');
    } finally {
      setBusy('');
    }
  }

  async function handleEditQuiz(quizItem) {
    setEditingQuiz(quizItem);
    setQuiz({
      title: quizItem.title,
      subject: quizItem.subject,
      timerMinutes: quizItem.timerMinutes || 25,
      published: quizItem.published ?? true,
      dailyQuiz: quizItem.dailyQuiz ?? false,
      questions: quizItem.questions || [blankQuestion],
    });
    setActiveTab('quizzes');
  }

  async function handleDeleteQuiz(quizId) {
    if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) return;
    
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

  async function submitAnnouncement(event) {
    event.preventDefault();
    if (!announcement.title.trim() || !announcement.body.trim()) {
      notify('Add both announcement title and message.');
      return;
    }
    setBusy('announcement');
    try {
      await createAnnouncement({ ...announcement, createdBy: user?.uid || null });
      notify('Announcement saved.');
      setAnnouncement({ title: '', body: '', target: 'all' });
    } catch (error) {
      notify(error.message || 'Connect Firebase to send announcements.');
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
    try {
      const text = await quizFile.text();
      const quizData = JSON.parse(text);

      if (!Array.isArray(quizData)) {
        throw new Error('Quiz file must contain an array of quizzes.');
      }

      let uploadedCount = 0;
      for (const quiz of quizData) {
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
          questions: cleanQuestions,
          createdBy: user?.uid || null,
        });
        uploadedCount++;
      }

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
    if (!newSubject.name.trim()) {
      notify('Enter a subject name.');
      return;
    }

    setBusy('subject');
    try {
      if (editingSubject) {
        await updateSubject(editingSubject.id, {
          name: newSubject.name.trim(),
          description: newSubject.description.trim(),
        });
        notify('Subject updated successfully.');
        setEditingSubject(null);
      } else {
        await createSubject({
          name: newSubject.name.trim(),
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
    if (!confirm('Are you sure you want to delete this subject? This will affect existing quizzes and resources.')) return;
    
    setBusy(`delete-subject-${subjectId}`);
    try {
      await deleteSubject(subjectId);
      notify('Subject deleted successfully.');
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

  async function submitExamTimer(event) {
    event.preventDefault();
    if (!examTimer.title.trim() || !examTimer.examDate) {
      notify('Enter both title and exam date.');
      return;
    }

    setBusy('exam-timer');
    try {
      await updateExamCountdown({
        title: examTimer.title.trim(),
        examDate: new Date(examTimer.examDate),
      });
      notify('Exam countdown updated successfully.');
      setExamTimer({ title: '', examDate: '' });
    } catch (error) {
      notify('Failed to update exam countdown.');
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
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'timer', label: 'Exam Timer', icon: Timer },
  ];

  function Metric({ icon: Icon, label, value, urgent }) {
    return (
      <Card className={`p-4 ${urgent ? 'ring-2 ring-red-500/50 bg-red-50/50 dark:bg-red-500/5' : ''}`}>
        <Icon className={`text-blue-600 ${urgent ? 'text-red-600' : ''}`} size={21} />
        <p className={`mt-3 text-xs font-bold uppercase tracking-[0.12em] ${urgent ? 'text-red-600' : 'text-slate-400'}`}>{label}</p>
        <p className={`mt-1 text-xl font-black ${urgent ? 'text-red-600' : 'text-slate-950 dark:text-white'}`}>{value}</p>
      </Card>
    );
  }

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
                <Button onClick={() => { setEditingQuiz(null); setActiveTab('create-quiz'); }} className="whitespace-nowrap">
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
          {(activeTab === 'create-quiz' || editingQuiz) && (
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
                  <Button variant="accent" disabled={busy === 'quiz'}>
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
              <Button variant="accent" disabled={busy === 'quizFile'} className="w-full">
                <Upload size={17} /> {busy === 'quizFile' ? 'Uploading...' : 'Upload quizzes'}
              </Button>
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
              <Button variant="accent" disabled={busy === 'subject'}>
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
            <h3 className="font-black text-slate-950 dark:text-white">User Management</h3>
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
              <h3 className="font-black text-slate-950 dark:text-white">Upload resource</h3>
            </div>
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
              <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                Document file (PDF, Word, Images, etc.)
                <input
                  type="file"
                  accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,image/*"
                  onChange={(event) => setResource({ ...resource, file: event.target.files?.[0] || null })}
                  className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold dark:border-white/10 dark:bg-slate-950"
                />
              </label>
              <Button variant="accent" disabled={busy === 'resource'} className="w-full">
                <Upload size={17} /> {busy === 'resource' ? 'Uploading...' : 'Upload resource'}
              </Button>
            </form>
          </Card>

          <Card>
            <h3 className="font-black text-slate-950 dark:text-white">Recent Resources</h3>
            <div className="mt-4 space-y-3">
              {existingResources.slice(0, 10).map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
                  <div>
                    <p className="font-bold text-slate-950 dark:text-white">{item.title}</p>
                    <p className="text-sm text-slate-500">{item.subject} - {item.type}</p>
                  </div>
                  <div className="text-xs text-slate-400">
                    {item.createdAt?.toDate?.()?.toLocaleDateString() || 'Recent'}
                  </div>
                </div>
              ))}
              {existingResources.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400">No resources uploaded yet.</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <Card>
          <div className="flex items-center gap-3">
            <Megaphone className="text-blue-600" />
            <h3 className="font-black text-slate-950 dark:text-white">Send announcement</h3>
          </div>
          <form onSubmit={submitAnnouncement} className="mt-4 grid gap-3 sm:grid-cols-2">
            <Input
              label="Title"
              value={announcement.title}
              onChange={(value) => setAnnouncement({ ...announcement, title: value })}
              placeholder="New quiz uploaded"
            />
            <Select label="Target" value={announcement.target} onChange={(value) => setAnnouncement({ ...announcement, target: value })}>
              <option value="all">All</option>
              <option value="students">Students</option>
              <option value="admins">Admins</option>
            </Select>
            <div className="sm:col-span-2">
              <Textarea
                label="Message"
                value={announcement.body}
                onChange={(value) => setAnnouncement({ ...announcement, body: value })}
                placeholder="Tell students what changed"
              />
            </div>
            <Button variant="accent" disabled={busy === 'announcement'} className="sm:col-span-2">
              <Send size={17} /> {busy === 'announcement' ? 'Sending...' : 'Save announcement'}
            </Button>
          </form>
        </Card>
      )}

      {/* Exam Timer Tab */}
      {activeTab === 'timer' && (
        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-3">
              <Clock className="text-blue-600" />
              <h3 className="font-black text-slate-950 dark:text-white">Exam Countdown Manager</h3>
            </div>
            <form onSubmit={submitExamTimer} className="mt-4 grid gap-3">
              <Input
                label="Countdown Title"
                value={examTimer.title}
                onChange={(value) => setExamTimer({ ...examTimer, title: value })}
                placeholder="Final Exam 2025"
              />
              <Input
                label="Exam Date & Time"
                type="datetime-local"
                value={examTimer.examDate}
                onChange={(value) => setExamTimer({ ...examTimer, examDate: value })}
              />
              <Button variant="accent" disabled={busy === 'exam-timer'}>
                <Clock size={17} /> {busy === 'exam-timer' ? 'Updating...' : 'Set Countdown'}
              </Button>
            </form>
          </Card>

          {examCountdown && (
            <Card>
              <h3 className="font-black text-slate-950 dark:text-white">Current Countdown</h3>
              <div className="mt-4 rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
                <p className="font-bold text-slate-950 dark:text-white">{examCountdown.title}</p>
                <p className="text-sm text-slate-500">
                  Exam Date: {examCountdown.examDate?.toDate?.()?.toLocaleString() || 'Not set'}
                </p>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
