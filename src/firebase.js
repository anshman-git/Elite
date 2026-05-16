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
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
  deleteDoc,
  Timestamp,
  increment,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { buildAttemptReviewData, calculateAverageScore, calculateStreak } from './utils';

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
        profileData = {
          name: sessionUser.displayName || 'Elite learner',
          email: sessionUser.email || '',
          role: isAdmin ? 'admin' : 'student',
          points: 0,
          weeklyPoints: 0,
          streak: 0,
          quizzesAttempted: 0,
          averageScore: 0,
          createdAt: serverTimestamp(),
          lastActiveAt: serverTimestamp(),
          lastAttemptDate: null,
        };
        await setDoc(doc(db, 'users', sessionUser.uid), profileData);
      } else {
        // Preserve Firestore role when it already indicates admin,
        // or upgrade based on auth custom claims.
        const currentRole = profileData.role === 'admin' || hasAdminClaim ? 'admin' : 'student';
        if (profileData.role !== currentRole) {
          await updateDoc(doc(db, 'users', sessionUser.uid), { role: currentRole });
          profileData.role = currentRole;
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
    await setDoc(doc(db, 'users', credential.user.uid), {
      name: cleanName,
      email: cleanEmail,
      role: 'student',
      points: 0,
      weeklyPoints: 0,
      streak: 0,
      quizzesAttempted: 0,
      averageScore: 0,
      createdAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
      lastAttemptDate: null,
    });
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
      callback(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    },
    (error) => {
      console.error('Error watching user attempts:', error);
      callback([]);
      onError?.(error);
    }
  );
}

export async function submitAttempt(userId, quizId, quizData, answers) {
  if (!db) throw new Error('Firebase not configured');

  const questions = quizData.questions || [];

  const score = questions.reduce((total, item, index) => {
    const questionId = item.id || item.question || `question-${index}`;
    return total + (answers[questionId] === item.answer ? 1 : 0);
  }, 0);

  const accuracy = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const pointsGained = Math.min(100, score * 10);
  const reviewData = buildAttemptReviewData(questions, answers);
  const attemptPayload = {
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
    completedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  };

  return runTransaction(db, async (transaction) => {
    const existingAttemptQuery = query(
      collection(db, 'attempts'),
      where('userId', '==', userId),
      where('quizId', '==', quizId),
      limit(1),
    );
    const existingAttemptSnap = await transaction.get(existingAttemptQuery);

    if (!existingAttemptSnap.empty) {
      return existingAttemptSnap.docs[0].ref;
    }

    const userRef = doc(db, 'users', userId);
    const userSnap = await transaction.get(userRef);
    const currentData = userSnap.exists() ? userSnap.data() : {};
    const currentAttempts = Number(currentData.quizzesAttempted) || 0;
    const newAttempts = currentAttempts + 1;
    const newAverage = calculateAverageScore(currentData.averageScore, currentAttempts, accuracy);
    const streakReference = currentData.lastAttemptDate || currentData.lastActiveAt;
    const newStreak = calculateStreak(currentData.streak, streakReference);
    const statsUpdate = {
      points: (Number(currentData.points) || 0) + pointsGained,
      weeklyPoints: (Number(currentData.weeklyPoints) || 0) + pointsGained,
      quizzesAttempted: newAttempts,
      averageScore: newAverage,
      streak: newStreak,
      lastAttemptDate: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
    };

    if (userSnap.exists()) {
      transaction.update(userRef, statsUpdate);
    } else {
      transaction.set(userRef, statsUpdate);
    }

    const attemptRef = doc(collection(db, 'attempts'));
    transaction.set(attemptRef, attemptPayload);
    return attemptRef;
  });
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
  return addDoc(collection(db, 'announcements'), { ...payload, createdAt: serverTimestamp() });
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
  const batch = writeBatch(db);
  usersSnapshot.docs.forEach((userDoc) => {
    batch.update(userDoc.ref, { weeklyPoints: 0 });
  });
  await batch.commit();
}

export async function resetAllUserStats() {
  if (!db) throw new Error('Firebase is not configured yet.');

  const usersSnapshot = await getDocs(collection(db, 'users'));
  const batch = writeBatch(db);

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
