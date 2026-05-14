import { useState, useEffect } from 'react';
import { FilePlus2, Megaphone, Plus, Send, Upload, UsersRound } from 'lucide-react';
import { createAnnouncement, createQuiz, uploadResource, watchCollection } from '../firebase';
import { subjects } from '../data/subjects';
import { Button, Card } from '../components/ui';

const blankQuestion = {
  question: '',
  options: ['', '', '', ''],
  answer: '',
  explanation: '',
};

export default function Admin({ notify, user }) {
  const [resource, setResource] = useState({
    title: '',
    subject: 'CSA',
    type: 'Notes',
    file: null,
  });
  const [quiz, setQuiz] = useState({
    title: '',
    subject: 'CSA',
    duration: 25,
    isDaily: true,
    questions: [blankQuestion],
  });
  const [quizFile, setQuizFile] = useState(null);
  const [announcement, setAnnouncement] = useState({ title: '', body: '', target: 'all' });
  const [busy, setBusy] = useState('');
  const [existingQuizzes, setExistingQuizzes] = useState([]);
  const [existingResources, setExistingResources] = useState([]);

  useEffect(() => {
    const unsubscribeQuizzes = watchCollection('quizzes', setExistingQuizzes, {
      take: 20,
      onError: (error) => console.error('Failed to load quizzes:', error),
    });
    const unsubscribeResources = watchCollection('resources', setExistingResources, {
      take: 20,
      onError: (error) => console.error('Failed to load resources:', error),
    });
    return () => {
      unsubscribeQuizzes();
      unsubscribeResources();
    };
  }, []);

  async function submitResource(event) {
    event.preventDefault();
    if (!resource.file) {
      notify('Choose a PDF or image before uploading.');
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
      setResource({ title: '', subject: 'CSA', type: 'Notes', file: null });
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

    if (!quiz.title.trim() || cleanQuestions.length === 0) {
      notify('Add a quiz title and at least one complete MCQ.');
      return;
    }

    setBusy('quiz');
    try {
      await createQuiz({
        title: quiz.title.trim(),
        subject: quiz.subject,
        duration: Number(quiz.duration),
        isDaily: quiz.isDaily,
        questions: cleanQuestions,
        createdBy: user?.uid || null,
      });
      notify('Quiz created in Firestore.');
      setQuiz({ title: '', subject: 'CSA', duration: 25, isDaily: true, questions: [blankQuestion] });
    } catch (error) {
      notify(error.message || 'Connect Firebase to create quizzes.');
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

      // Validate the structure
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
          duration: Number(quiz.duration) || 25,
          isDaily: quiz.isDaily || false,
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

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Admin</p>
        <h2 className="text-2xl font-black text-slate-950 dark:text-white">Management panel</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminAction icon={Plus} title="Add MCQs" body="Create subject-wise questions with answer keys." />
        <AdminAction icon={Upload} title="Upload files" body="PDF and image support for notes and papers." />
        <AdminAction icon={UsersRound} title="Manage users" body="Review roles, streaks, scores, and rankings." />
        <AdminAction icon={Megaphone} title="Announcements" body="Send quiz, notes, and countdown reminders." />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <div className="flex items-center gap-3">
            <FilePlus2 className="text-blue-600" />
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
                {subjects.map((subject) => <option key={subject.id}>{subject.name}</option>)}
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
          <div className="flex items-center gap-3">
            <Plus className="text-blue-600" />
            <h3 className="font-black text-slate-950 dark:text-white">Create quiz</h3>
          </div>
          <form onSubmit={submitQuiz} className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Quiz title" value={quiz.title} onChange={(value) => setQuiz({ ...quiz, title: value })} placeholder="Daily Mixed MCQ" />
              <Select label="Subject" value={quiz.subject} onChange={(value) => setQuiz({ ...quiz, subject: value })}>
                <option>All</option>
                {subjects.map((subject) => <option key={subject.id}>{subject.name}</option>)}
              </Select>
              <Input label="Timer minutes" type="number" value={quiz.duration} onChange={(value) => setQuiz({ ...quiz, duration: value })} />
              <label className="flex min-h-12 items-center justify-between rounded-2xl bg-slate-50 px-4 text-sm font-bold text-slate-700 dark:bg-white/5 dark:text-slate-200">
                Daily quiz
                <input
                  type="checkbox"
                  checked={quiz.isDaily}
                  onChange={(event) => setQuiz({ ...quiz, isDaily: event.target.checked })}
                  className="h-5 w-5 accent-blue-600"
                />
              </label>
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
                {busy === 'quiz' ? 'Creating...' : 'Create quiz'}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      <Card>
        <div className="flex items-center gap-3">
          <Upload className="text-blue-600" />
          <h3 className="font-black text-slate-950 dark:text-white">Bulk upload quizzes</h3>
        </div>
        <form onSubmit={submitQuizFile} className="mt-4 grid gap-3">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Upload a JSON file containing multiple quizzes. Each quiz should have title, subject, duration, isDaily, and questions array.
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

      <Card>
        <h3 className="font-black text-slate-950 dark:text-white">Analytics snapshot</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Metric value={existingQuizzes.length} label="Total quizzes" />
          <Metric value={existingResources.length} label="Total resources" />
          <Metric value="38" label="Active students" />
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h3 className="font-black text-slate-950 dark:text-white">Recent quizzes</h3>
          <div className="mt-4 space-y-3">
            {existingQuizzes.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
                <div>
                  <p className="font-bold text-slate-950 dark:text-white">{item.title}</p>
                  <p className="text-sm text-slate-500">{item.subject} • {item.questions?.length || 0} questions</p>
                </div>
                <div className="text-xs text-slate-400">
                  {item.createdAt?.toDate?.()?.toLocaleDateString() || 'Recent'}
                </div>
              </div>
            ))}
            {existingQuizzes.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">No quizzes created yet.</p>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="font-black text-slate-950 dark:text-white">Recent resources</h3>
          <div className="mt-4 space-y-3">
            {existingResources.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
                <div>
                  <p className="font-bold text-slate-950 dark:text-white">{item.title}</p>
                  <p className="text-sm text-slate-500">{item.subject} • {item.type}</p>
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
    </div>
  );
}

function AdminAction({ icon: Icon, title, body }) {
  return (
    <Card interactive>
      <Icon className="text-blue-600" size={23} />
      <h3 className="mt-3 font-black text-slate-950 dark:text-white">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{body}</p>
    </Card>
  );
}

function Input({ label, value, onChange, ...props }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-blue-400 dark:border-white/10 dark:bg-slate-950"
        {...props}
      />
    </label>
  );
}

function Select({ label, value, onChange, children }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-blue-400 dark:border-white/10 dark:bg-slate-950"
      >
        {children}
      </select>
    </label>
  );
}

function Textarea({ label, value, onChange, ...props }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-24 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-400 dark:border-white/10 dark:bg-slate-950"
        {...props}
      />
    </label>
  );
}

function Metric({ value, label }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
      <p className="text-2xl font-black text-blue-600">{value}</p>
      <p className="text-sm font-semibold text-slate-500">{label}</p>
    </div>
  );
}
