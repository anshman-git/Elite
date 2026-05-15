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
  increment,
  updateDoc,
} from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes, deleteObject } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

const app = firebaseEnabled ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;
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
          streak: 0,
          points: 0,
          createdAt: serverTimestamp(),
          lastActiveAt: serverTimestamp(),
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
      streak: 0,
      points: 0,
      createdAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
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

  // Calculate score
  const score = questions.reduce((total, item, index) => {
    const questionId = item.id || item.question || `question-${index}`;
    return total + (answers[questionId] === item.answer ? 1 : 0);
  }, 0);

  const accuracy = questions.length > 0 ? (score / questions.length) * 100 : 0;

  // Create attempt document
  const attemptRef = await addDoc(collection(db, 'attempts'), {
    userId,
    uid: userId,
    quizId,
    subject: quizData.subject,
    score,
    total: questions.length,
    accuracy: Math.round(accuracy),
    timeTaken: (quizData.timerMinutes || quizData.duration || 25) * 60, // Will be updated with actual time
    answers: Object.keys(answers).length > 0 ? answers : {},
    completedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });

  // Update user points and last active
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      points: increment(Math.min(100, score * 10)),
      lastActiveAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to update user points:', error);
    // Don't throw - attempt is saved even if points update fails
  }

  return attemptRef;
}

export async function createQuiz(payload) {
  if (!db) throw new Error('Firebase is not configured yet.');
  return addDoc(collection(db, QUIZZES_COLLECTION), { 
    ...payload, 
    published: payload.published ?? true,
    dailyQuiz: payload.dailyQuiz ?? false,
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

export async function uploadResource({ file, subject, type, title, createdBy }) {
  if (!storage || !db) throw new Error('Firebase is not configured yet.');

  // Validate file
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const ALLOWED_TYPES = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ];

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum size: 50MB. Your file: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed: PDF, Word documents, Excel, PowerPoint, images, and text files.`);
  }

  const fileRef = ref(storage, `resources/${subject}/${Date.now()}-${file.name}`);

  try {
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    const storagePath = fileRef.fullPath || `resources/${subject}/${Date.now()}-${file.name}`;
    return addDoc(collection(db, 'resources'), {
      title,
      subject,
      type,
      fileType: file.type,
      fileSize: file.size,
      url,
      storagePath,
      createdBy: createdBy || null,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    // Clean up failed upload
    await deleteObject(fileRef).catch(() => {}); // Ignore cleanup errors
    throw error;
  }
}

export async function deleteResource(resourceId) {
  if (!db || !storage) throw new Error('Firebase is not configured yet.');

  const resourceRef = doc(db, 'resources', resourceId);
  const snap = await getDoc(resourceRef);
  if (!snap.exists()) {
    // Nothing to delete
    return;
  }

  const data = snap.data();
  const pathFromDoc = data.storagePath;
  const url = data.url;

  // Attempt to delete storage object if we can determine its path
  try {
    let storagePath = pathFromDoc;
    if (!storagePath && url) {
      // Try to parse path from download URL
      // Format: https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<encodedPath>?alt=media&token=...
      const match = url.match(/\/o\/(.*?)\?/);
      if (match && match[1]) storagePath = decodeURIComponent(match[1]);
    }

    if (storagePath) {
      await deleteObject(ref(storage, storagePath));
    }
  } catch (error) {
    console.error('Failed to delete storage object for resource', resourceId, error);
    // proceed to delete doc even if storage delete fails
  }

  // Delete the Firestore document
  return deleteDoc(resourceRef);
}

export async function createAnnouncement(payload) {
  if (!db) throw new Error('Firebase is not configured yet.');
  return addDoc(collection(db, 'announcements'), { ...payload, createdAt: serverTimestamp() });
}

// Quiz CRUD functions
export async function updateQuiz(quizId, payload) {
  if (!db) throw new Error('Firebase is not configured yet.');
  return updateDoc(doc(db, QUIZZES_COLLECTION, quizId), { ...payload, updatedAt: serverTimestamp() });
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
