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
      const isAdmin = idTokenResult.claims.admin === true;

      const profile = await getDoc(doc(db, 'users', sessionUser.uid));
      let profileData = profile.exists() ? profile.data() : null;
      if (!profile.exists()) {
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
        // Always update role based on current custom claims
        const currentRole = isAdmin ? 'admin' : 'student';
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
    quizId,
    subject: quizData.subject,
    score,
    total: questions.length,
    accuracy: Math.round(accuracy),
    timeTaken: quizData.duration * 60, // Will be updated with actual time
    answers: Object.keys(answers).length > 0 ? answers : {},
    completedAt: serverTimestamp(),
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
  return addDoc(collection(db, QUIZZES_COLLECTION), { ...payload, createdAt: serverTimestamp() });
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
    return addDoc(collection(db, 'resources'), {
      title,
      subject,
      type,
      fileType: file.type,
      fileSize: file.size,
      url,
      createdBy: createdBy || null,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    // Clean up failed upload
    await deleteObject(fileRef).catch(() => {}); // Ignore cleanup errors
    throw error;
  }
}

export async function createAnnouncement(payload) {
  if (!db) throw new Error('Firebase is not configured yet.');
  return addDoc(collection(db, 'announcements'), { ...payload, createdAt: serverTimestamp() });
}
