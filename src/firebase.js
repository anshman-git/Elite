import { initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  deleteDoc,
  Timestamp,
  arrayRemove,
  arrayUnion,
  increment,
  updateDoc,
  writeBatch as firestoreWriteBatch,
} from 'firebase/firestore';
import {
  buildAttemptReviewData,
  calculateAverageScore,
  calculateStreak,
  getLevelFromXp,
  isCompletedAttempt,
} from './utils';

const SUBMIT_LOG = '[submitAttempt]';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

const app = firebaseEnabled ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const QUIZZES_COLLECTION = 'quizzes';

const defaultProfileFields = {
  bio: '',
  website: '',
  avatarStyle: 'bottts',
  bannerStyle: 'cyber',
  followers: [],
  following: [],
  achievements: [],
};

function getProfileDefaults(overrides = {}) {
  return {
    ...defaultProfileFields,
    points: 0,
    weeklyPoints: 0,
    streak: 0,
    bestStreak: 0,
    xp: 0,
    level: 1,
    totalCorrectAnswers: 0,
    quizzesAttempted: 0,
    averageScore: 0,
    lastActiveAt: serverTimestamp(),
    lastAttemptDate: null,
    lastQuizDate: null,
    ...overrides,
  };
}

if (auth) {
  setPersistence(auth, browserLocalPersistence);
}

export function watchAuth(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, async (sessionUser) => {
    if (!sessionUser) {
      callback(null);
      return;
    }

    try {
      // Force refresh the ID token to get latest custom claims
      await sessionUser.getIdToken(true);
      const idTokenResult = await sessionUser.getIdTokenResult();
      const hasAdminClaim = idTokenResult.claims.admin === true;

      const profileSnap = await getDoc(doc(db, 'users', sessionUser.uid));
      let profileData = profileSnap.exists() ? profileSnap.data() : null;
      const isAdmin = hasAdminClaim || profileData?.role === 'admin';

      if (!profileSnap.exists()) {
        profileData = getProfileDefaults({
          name: sessionUser.displayName || 'Elite learner',
          email: sessionUser.email || '',
          role: isAdmin ? 'admin' : 'student',
          createdAt: serverTimestamp(),
        });
        await setDoc(doc(db, 'users', sessionUser.uid), profileData);
      } else {
        // Preserve Firestore role when it already indicates admin,
        // or upgrade based on auth custom claims.
        const currentRole = profileData.role === 'admin' || hasAdminClaim ? 'admin' : 'student';
        if (profileData.role !== currentRole) {
          await updateDoc(doc(db, 'users', sessionUser.uid), { role: currentRole });
          profileData.role = currentRole;
        }

        const patches = {};
        if (profileData.bestStreak === undefined) patches.bestStreak = 0;
        if (profileData.xp === undefined) patches.xp = 0;
        if (profileData.level === undefined) patches.level = 1;
        if (profileData.totalCorrectAnswers === undefined) patches.totalCorrectAnswers = 0;
        if (profileData.achievements === undefined) patches.achievements = [];
        if (profileData.followers === undefined) patches.followers = [];
        if (profileData.following === undefined) patches.following = [];
        if (profileData.bio === undefined) patches.bio = '';
        if (profileData.website === undefined) patches.website = '';
        if (profileData.avatarStyle === undefined) patches.avatarStyle = 'bottts';
        if (profileData.bannerStyle === undefined) patches.bannerStyle = 'cyber';
        if (profileData.lastQuizDate === undefined) patches.lastQuizDate = null;
        if (Object.keys(patches).length > 0) {
          await updateDoc(doc(db, 'users', sessionUser.uid), patches);
          profileData = { ...profileData, ...patches };
        }
      }
      callback({ ...sessionUser, ...profileData });
    } catch (error) {
      console.error('Error loading user profile:', error);
      callback(sessionUser); // Fallback to basic user data
    }
  });
}

export async function loginWithEmail(email, password) {
  if (!auth) throw new Error('Firebase is not configured yet.');
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signupWithEmail({ name, email, password }) {
  if (!auth) throw new Error('Firebase is not configured yet.');
  const cleanName = name.trim();
  const cleanEmail = email.trim();

  if (!cleanName) throw new Error('Enter your full name.');
  if (password.length < 6) throw new Error('Password must be at least 6 characters.');

  const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
  await updateProfile(credential.user, { displayName: cleanName });

  try {
    await setDoc(doc(db, 'users', credential.user.uid), getProfileDefaults({
      name: cleanName,
      email: cleanEmail,
      role: 'student',
      createdAt: serverTimestamp(),
    }));
  } catch (error) {
    console.error('Failed to create user profile:', error);
    return { credential, profileCreated: false, profileError: error };
  }

  return { credential, profileCreated: true };
}

export function getFriendlyFirebaseError(error) {
  const code = error?.code || '';
  const messages = {
    'auth/email-already-in-use': 'This email already has an account. Try logging in instead.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/operation-not-allowed': 'Enable Email/Password sign-in in Firebase Authentication.',
    'auth/unauthorized-domain': 'Add this domain in Firebase Authentication authorized domains.',
    'auth/network-request-failed': 'Network error. Check your connection and try again.',
    'permission-denied': 'Account was created, but Firestore rules blocked profile setup.',
  };

  return messages[code] || error?.message || 'Something went wrong. Please try again.';
}

export async function resetPassword(email) {
  if (!auth) throw new Error('Firebase is not configured yet.');
  return sendPasswordResetEmail(auth, email);
}

export async function logout() {
  if (!auth) return;
  return signOut(auth);
}

export async function fetchCollection(name, sortField = 'createdAt', take = 30) {
  if (!db) return [];
  const snapshot = await getDocs(query(collection(db, name), orderBy(sortField, 'desc'), limit(take)));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export function watchCollection(name, callback, options = {}) {
  const { sortField = 'createdAt', sortDirection = 'desc', take = 30, onError } = options;

  if (!db) {
    callback([]);
    return () => {};
  }

  let unsubscribe;
  try {
    const collectionQuery = query(
      collection(db, name),
      orderBy(sortField, sortDirection),
      limit(take)
    );

    unsubscribe = onSnapshot(
      collectionQuery,
      (snapshot) => {
        try {
          const data = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
          callback(data);
        } catch (error) {
          console.error(`Error mapping ${name} documents:`, error);
          onError?.(new Error(`Failed to process ${name} data`));
        }
      },
      (error) => {
        console.error(`Error watching ${name}:`, error);
        callback([]); // Empty state for UI
        onError?.(error); // Notify user
      }
    );
  } catch (error) {
    console.error(`Error setting up watch for ${name}:`, error);
    onError?.(error);
  }

  return () => unsubscribe?.();
}

export function watchDocument(collectionName, documentId, callback, options = {}) {
  const { onError } = options;

  if (!db || !documentId) {
    callback(null);
    return () => {};
  }

  const documentRef = doc(db, collectionName, documentId);
  return onSnapshot(
    documentRef,
    (snapshot) => {
      callback(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
    },
    (error) => {
      console.error(`Error watching ${collectionName}/${documentId}:`, error);
      onError?.(error);
    }
  );
}

export function watchUserAttempts(userId, callback, options = {}) {
  const { take = 50, onError } = options;

  if (!db || !userId) {
    callback([]);
    return () => {};
  }

  const userAttemptsQuery = query(
    collection(db, 'attempts'),
    where('userId', '==', userId),
    orderBy('completedAt', 'desc'),
    limit(take)
  );

  return onSnapshot(
    userAttemptsQuery,
    (snapshot) => {
      const attempts = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .filter(isCompletedAttempt);
      callback(attempts);
    },
    (error) => {
      console.error('Error watching user attempts:', error);
      callback([]);
      onError?.(error);
    }
  );
}

async function rollbackPendingAttempt(attemptRef, reason) {
  if (!attemptRef) return;
  try {
    await deleteDoc(attemptRef);
    console.warn(SUBMIT_LOG, 'Rolled back pending attempt', { attemptId: attemptRef.id, reason });
  } catch (rollbackError) {
    console.error(SUBMIT_LOG, 'ROLLBACK FAILED — pending attempt may block retry', {
      attemptId: attemptRef.id,
      reason,
      rollbackError,
    });
    throw new Error(
      'Quiz could not be finalized and cleanup failed. Ask an admin to remove the stuck attempt, or try again.',
    );
  }
}

export async function submitAttempt(userId, quizId, quizData, answers) {
  if (!db) throw new Error('Firebase not configured');

  const questions = quizData.questions || [];
  const score = questions.reduce((total, item, index) => {
    const questionId = item.id || item.question || `question-${index}`;
    return total + (answers[questionId] === item.answer ? 1 : 0);
  }, 0);

  const accuracy = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const pointsGained = score * 10;
  const isWeeklyQuiz = quizData.weeklyTest === true;
  const weeklyPointsGained = pointsGained;

  console.info(SUBMIT_LOG, 'Starting submission', {
    userId,
    quizId,
    score,
    accuracy,
    pointsGained,
    weeklyPointsGained,
    isWeeklyQuiz,
  });

  const existingAttemptQuery = query(
    collection(db, 'attempts'),
    where('userId', '==', userId),
    where('quizId', '==', quizId),
    limit(10),
  );
  const existingAttemptSnap = await getDocs(existingAttemptQuery);

  const completedAttempt = existingAttemptSnap.docs.find((item) =>
    isCompletedAttempt(item.data()),
  );
  if (completedAttempt) {
    console.warn(SUBMIT_LOG, 'Blocked — completed attempt already exists', {
      attemptId: completedAttempt.id,
    });
    const error = new Error('You have already completed this quiz.');
    error.code = 'already-attempted';
    throw error;
  }

  const pendingAttempts = existingAttemptSnap.docs.filter(
    (item) => item.data().status === 'pending',
  );
  await Promise.all(
    pendingAttempts.map(async (item) => {
      try {
        await deleteDoc(item.ref);
        console.info(SUBMIT_LOG, 'Removed stale pending attempt', { attemptId: item.id });
      } catch (cleanupError) {
        console.error(SUBMIT_LOG, 'Failed to remove stale pending attempt', {
          attemptId: item.id,
          cleanupError,
        });
      }
    }),
  );

  const reviewData = buildAttemptReviewData(questions, answers);
  const pendingPayload = {
    userId,
    uid: userId,
    quizId,
    quizTitle: quizData.title || 'Quiz',
    subject: quizData.subject,
    score,
    total: questions.length,
    accuracy,
    timeTaken: (quizData.timerMinutes || quizData.duration || 25) * 60,
    answers: Object.keys(answers).length > 0 ? answers : {},
    questions: reviewData.questionTexts,
    selectedAnswers: reviewData.selectedAnswers,
    correctAnswers: reviewData.correctAnswers,
    reviewItems: reviewData.reviewItems,
    status: 'pending',
    createdAt: serverTimestamp(),
  };

  let attemptRef;
  try {
    attemptRef = await addDoc(collection(db, 'attempts'), pendingPayload);
    console.info(SUBMIT_LOG, 'Pending attempt created', { attemptId: attemptRef.id });
  } catch (createError) {
    console.error(SUBMIT_LOG, 'Failed to create pending attempt', createError);
    throw createError;
  }

  const userRef = doc(db, 'users', userId);
  let userSnap;
  try {
    userSnap = await getDoc(userRef);
  } catch (readError) {
    console.error(SUBMIT_LOG, 'Failed to read user profile', readError);
    await rollbackPendingAttempt(attemptRef, 'user-read-failed');
    throw readError;
  }

  const currentData = userSnap.exists() ? userSnap.data() : {};
  const currentAttempts = Number(currentData.quizzesAttempted) || 0;
  const newAttempts = currentAttempts + 1;
  const newAverage = calculateAverageScore(currentData.averageScore, currentAttempts, accuracy);
  const streakReference = currentData.lastAttemptDate || currentData.lastActiveAt;
  const newStreak = calculateStreak(currentData.streak, streakReference);
  const perfectBonus = questions.length > 0 && score === questions.length ? 20 : 0;
  const streakMultiplier = 1 + Math.min(Math.max(newStreak - 1, 0) * 0.05, 0.25);
  const xpGained = Math.round(((score * 10) + perfectBonus) * streakMultiplier);
  const currentXp = Number(currentData.xp) || 0;
  const newXp = currentXp + xpGained;
  const newLevel = getLevelFromXp(newXp);
  const bestStreak = Math.max(Number(currentData.bestStreak) || 0, newStreak);
  const totalCorrectAnswers = (Number(currentData.totalCorrectAnswers) || 0) + score;

  const statsUpdate = {
    points: (Number(currentData.points) || 0) + pointsGained,
    weeklyPoints: (Number(currentData.weeklyPoints) || 0) + weeklyPointsGained,
    xp: newXp,
    level: newLevel,
    totalCorrectAnswers,
    quizzesAttempted: newAttempts,
    averageScore: newAverage,
    streak: newStreak,
    bestStreak,
    lastQuizDate: serverTimestamp(),
    lastAttemptDate: serverTimestamp(),
    lastActiveAt: serverTimestamp(),
  };

  if (score === questions.length && questions.length > 0) {
    statsUpdate.achievements = arrayUnion('Perfect Score');
  }

  console.info(SUBMIT_LOG, 'Updating user stats / leaderboard fields', {
    userId,
    statsUpdate: {
      ...statsUpdate,
      lastQuizDate: '(serverTimestamp)',
      lastAttemptDate: '(serverTimestamp)',
      lastActiveAt: '(serverTimestamp)',
    },
  });

  try {
    if (userSnap.exists()) {
      await updateDoc(userRef, statsUpdate);
    } else {
      await setDoc(userRef, {
        name: 'Elite learner',
        email: '',
        role: 'student',
        points: 0,
        weeklyPoints: 0,
        streak: 0,
        bestStreak: 0,
        xp: 0,
        level: 1,
        totalCorrectAnswers: 0,
        achievements: [],
        quizzesAttempted: 0,
        averageScore: 0,
        createdAt: serverTimestamp(),
        ...statsUpdate,
      });
    }
    console.info(SUBMIT_LOG, 'User stats updated (points, weeklyPoints, quizzesAttempted, averageScore, streak)');
  } catch (statsError) {
    console.error(SUBMIT_LOG, 'Stats update failed — rolling back attempt', statsError);
    await rollbackPendingAttempt(attemptRef, 'stats-update-failed');
    const error = new Error(getFriendlyFirebaseError(statsError) || 'Could not update your score. Please try again.');
    error.code = 'stats-update-failed';
    throw error;
  }

  try {
    await updateDoc(attemptRef, {
      status: 'completed',
      completedAt: serverTimestamp(),
    });
    console.info(SUBMIT_LOG, 'Attempt marked completed', { attemptId: attemptRef.id });
  } catch (completeError) {
    console.error(SUBMIT_LOG, 'Failed to mark attempt completed — rolling back', completeError);
    await rollbackPendingAttempt(attemptRef, 'mark-completed-failed');
    const error = new Error('Could not finalize your quiz attempt. Please try again.');
    error.code = 'complete-failed';
    throw error;
  }

  console.info(SUBMIT_LOG, 'Submission successful', { attemptId: attemptRef.id, quizId, userId });
  return attemptRef;
}

export async function createQuiz(payload) {
  if (!db) throw new Error('Firebase is not configured yet.');
  return addDoc(collection(db, QUIZZES_COLLECTION), { 
    ...payload, 
    published: payload.published ?? true,
    dailyQuiz: payload.dailyQuiz ?? false,
    weeklyTest: payload.weeklyTest ?? false,
    timerMinutes: payload.timerMinutes || payload.duration || 25,
    createdAt: serverTimestamp() 
  });
}

export function watchQuizzes(callback, options = {}) {
  return watchCollection(QUIZZES_COLLECTION, callback, options);
}

export async function fetchQuizzes(take = 30) {
  return fetchCollection(QUIZZES_COLLECTION, 'createdAt', take);
}

function normalizeResourceUrl(url) {
  const trimmed = url?.trim();
  if (!trimmed) throw new Error('Paste a file URL.');
  try {
    const parsed = new URL(trimmed);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('URL must start with http:// or https://');
    }
    return parsed.toString();
  } catch {
    throw new Error('Enter a valid file URL (Google Drive, GitHub raw, Dropbox, etc.).');
  }
}

export async function createResourceLink({ title, subject, type, url, createdBy }) {
  if (!db) throw new Error('Firebase is not configured yet.');

  const fileUrl = normalizeResourceUrl(url);

  return addDoc(collection(db, 'resources'), {
    title: title?.trim() || 'Untitled resource',
    subject: subject || 'General',
    type: type || 'Notes',
    url: fileUrl,
    fileUrl,
    createdBy: createdBy || null,
    createdAt: serverTimestamp(),
  });
}

/** @deprecated Use createResourceLink — kept for import compatibility */
export const uploadResource = createResourceLink;

export async function deleteResource(resourceId) {
  if (!db) throw new Error('Firebase is not configured yet.');
  return deleteDoc(doc(db, 'resources', resourceId));
}

export async function createAnnouncement(payload) {
  if (!db) throw new Error('Firebase is not configured yet.');
  return addDoc(collection(db, 'announcements'), { ...payload, type: payload.type || 'announcement', createdAt: serverTimestamp() });
}

// Quiz CRUD functions
export async function updateQuiz(quizId, payload) {
  if (!db) throw new Error('Firebase is not configured yet.');
  
  // Ensure weeklyTest field is safely set when updating old quizzes
  const safePayload = {
    ...payload,
    weeklyTest: payload.weeklyTest ?? false,
    updatedAt: serverTimestamp(),
  };
  
  return updateDoc(doc(db, QUIZZES_COLLECTION, quizId), safePayload);
}

export async function deleteQuiz(quizId) {
  if (!db) throw new Error('Firebase is not configured yet.');
  return deleteDoc(doc(db, QUIZZES_COLLECTION, quizId));
}

export async function duplicateQuiz(quizId) {
  if (!db) throw new Error('Firebase is not configured yet.');
  const quizDoc = await getDoc(doc(db, QUIZZES_COLLECTION, quizId));
  if (!quizDoc.exists()) throw new Error('Quiz not found');
  
  const quizData = quizDoc.data();
  const { id, createdAt, ...duplicateData } = quizData;
  return addDoc(collection(db, QUIZZES_COLLECTION), {
    ...duplicateData,
    title: `${duplicateData.title} (Copy)`,
    published: false,
    dailyQuiz: false,
    createdAt: serverTimestamp(),
  });
}

// Subject CRUD functions
export async function createSubject(payload) {
  if (!db) throw new Error('Firebase is not configured yet.');
  return addDoc(collection(db, 'subjects'), { ...payload, createdAt: serverTimestamp() });
}

export async function updateSubject(subjectId, payload) {
  if (!db) throw new Error('Firebase is not configured yet.');
  return updateDoc(doc(db, 'subjects', subjectId), { ...payload, updatedAt: serverTimestamp() });
}

export async function deleteSubject(subjectId) {
  if (!db) throw new Error('Firebase is not configured yet.');
  return deleteDoc(doc(db, 'subjects', subjectId));
}

export async function fetchSubjects(take = 50) {
  return fetchCollection('subjects', 'name', take);
}

export function watchSubjects(callback, options = {}) {
  return watchCollection('subjects', callback, { sortField: 'name', sortDirection: 'asc', ...options });
}

// User management functions
export async function updateUser(userId, payload) {
  if (!db) throw new Error('Firebase is not configured yet.');
  return updateDoc(doc(db, 'users', userId), { ...payload, updatedAt: serverTimestamp() });
}

export async function followUser(currentUserId, targetUserId, currentUserName = 'Someone') {
  if (!db) throw new Error('Firebase is not configured yet.');
  if (!currentUserId || !targetUserId) throw new Error('Missing user id.');
  if (currentUserId === targetUserId) throw new Error('You cannot follow yourself.');

  const currentRef = doc(db, 'users', currentUserId);
  const targetRef = doc(db, 'users', targetUserId);
  const currentSnap = await getDoc(currentRef);
  const targetSnap = await getDoc(targetRef);

  if (!targetSnap.exists()) throw new Error('Profile not found.');
  const currentData = currentSnap.exists() ? currentSnap.data() : {};
  const alreadyFollowing = Array.isArray(currentData.following) && currentData.following.includes(targetUserId);
  if (alreadyFollowing) return { alreadyFollowing: true };

  const batch = firestoreWriteBatch(db);
  batch.update(currentRef, {
    following: arrayUnion(targetUserId),
    lastActiveAt: serverTimestamp(),
  });
  batch.update(targetRef, {
    followers: arrayUnion(currentUserId),
    xp: increment(5),
    lastActiveAt: serverTimestamp(),
  });
  batch.set(doc(collection(db, 'notifications')), {
    targetUserId,
    actorUserId: currentUserId,
    type: 'follow',
    title: 'New follower',
    body: `${currentUserName} followed you.`,
    read: false,
    createdAt: serverTimestamp(),
  });
  await batch.commit();
  return { followed: true };
}

export async function unfollowUser(currentUserId, targetUserId) {
  if (!db) throw new Error('Firebase is not configured yet.');
  if (!currentUserId || !targetUserId) throw new Error('Missing user id.');
  if (currentUserId === targetUserId) throw new Error('You cannot unfollow yourself.');

  const batch = firestoreWriteBatch(db);
  batch.update(doc(db, 'users', currentUserId), {
    following: arrayRemove(targetUserId),
    lastActiveAt: serverTimestamp(),
  });
  batch.update(doc(db, 'users', targetUserId), {
    followers: arrayRemove(currentUserId),
    lastActiveAt: serverTimestamp(),
  });
  await batch.commit();
}

export function watchUserNotifications(userId, callback, options = {}) {
  const { take = 20, onError } = options;
  if (!db || !userId) {
    callback([]);
    return () => {};
  }

  const notificationsQuery = query(
    collection(db, 'notifications'),
    where('targetUserId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(take),
  );

  return onSnapshot(
    notificationsQuery,
    (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
    (error) => {
      console.error('Error watching notifications:', error);
      callback([]);
      onError?.(error);
    },
  );
}

export async function markNotificationRead(notificationId) {
  if (!db) throw new Error('Firebase is not configured yet.');
  return updateDoc(doc(db, 'notifications', notificationId), {
    read: true,
    readAt: serverTimestamp(),
  });
}

export async function markAllNotificationsRead(userId) {
  if (!db || !userId) return;
  const unreadQuery = query(
    collection(db, 'notifications'),
    where('targetUserId', '==', userId),
    where('read', '==', false),
    limit(25),
  );
  const snapshot = await getDocs(unreadQuery);
  const batch = firestoreWriteBatch(db);
  snapshot.docs.forEach((item) => {
    batch.update(item.ref, { read: true, readAt: serverTimestamp() });
  });
  await batch.commit();
}

export async function banUser(userId) {
  return updateUser(userId, { banned: true });
}

export async function unbanUser(userId) {
  return updateUser(userId, { banned: false });
}

export async function promoteToAdmin(userId) {
  return updateUser(userId, { role: 'admin' });
}

export async function demoteFromAdmin(userId) {
  return updateUser(userId, { role: 'student' });
}

export async function resetUserStreak(userId) {
  return updateUser(userId, { streak: 0 });
}

export async function getUsersCount() {
  if (!db) return 0;
  const snapshot = await getDocs(collection(db, 'users'));
  return snapshot.size;
}

export async function getOnlineUsersCount() {
  if (!db) return 0;
  const fiveMinutesAgo = Timestamp.fromDate(new Date(Date.now() - 5 * 60 * 1000));
  const q = query(collection(db, 'users'), where('lastActiveAt', '>', fiveMinutesAgo));
  const snapshot = await getDocs(q);
  return snapshot.size;
}

export function watchUsers(callback, options = {}) {
  return watchCollection('users', callback, { ...options, sortField: 'createdAt', sortDirection: 'desc' });
}

export async function resetWeeklyLeaderboard() {
  if (!db) throw new Error('Firebase is not configured yet.');

  const usersSnapshot = await getDocs(collection(db, 'users'));
  const batch = firestoreWriteBatch(db);
  usersSnapshot.docs.forEach((userDoc) => {
    batch.update(userDoc.ref, { weeklyPoints: 0 });
  });
  await batch.commit();
}

export async function resetAllUserStats() {
  if (!db) throw new Error('Firebase is not configured yet.');

  const usersSnapshot = await getDocs(collection(db, 'users'));
  const batch = firestoreWriteBatch(db);

  usersSnapshot.docs.forEach((userDoc) => {
    batch.update(userDoc.ref, {
      points: 0,
      weeklyPoints: 0,
      quizzesAttempted: 0,
      averageScore: 0,
      streak: 0,
    });
  });

  await batch.commit();
}

export async function giveWeeklyPoints(userId, amount = 100) {
  if (!db) throw new Error('Firebase is not configured yet.');
  return updateDoc(doc(db, 'users', userId), {
    points: increment(amount),
    weeklyPoints: increment(amount),
    lastActiveAt: serverTimestamp(),
  });
}

// Settings functions
export async function updateExamCountdown(payload) {
  if (!db) throw new Error('Firebase is not configured yet.');
  return setDoc(doc(db, 'settings', 'examCountdown'), { ...payload, updatedAt: serverTimestamp() });
}

export async function getExamCountdown() {
  if (!db) return null;
  const docSnap = await getDoc(doc(db, 'settings', 'examCountdown'));
  return docSnap.exists() ? docSnap.data() : null;
}

export function watchExamCountdown(callback) {
  if (!db) {
    callback(null);
    return () => {};
  }
  return onSnapshot(doc(db, 'settings', 'examCountdown'), (doc) => {
    callback(doc.exists() ? doc.data() : null);
  });
}
