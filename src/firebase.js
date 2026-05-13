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
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';

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
      const profile = await getDoc(doc(db, 'users', sessionUser.uid));
      let profileData = profile.exists() ? profile.data() : null;
      if (!profile.exists()) {
        profileData = {
          name: sessionUser.displayName || 'Elite learner',
          email: sessionUser.email || '',
          role: 'student',
          streak: 0,
          points: 0,
          createdAt: serverTimestamp(),
          lastActiveAt: serverTimestamp(),
        };
        await setDoc(doc(db, 'users', sessionUser.uid), profileData);
      }
      callback({ ...sessionUser, ...profileData });
    } catch {
      callback(sessionUser);
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

export async function createQuiz(payload) {
  if (!db) throw new Error('Firebase is not configured yet.');
  return addDoc(collection(db, 'quizzes'), { ...payload, createdAt: serverTimestamp() });
}

export async function uploadResource({ file, subject, type, title, createdBy }) {
  if (!storage || !db) throw new Error('Firebase is not configured yet.');
  const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
  if (!allowed.includes(file.type)) throw new Error('Only PDF and image files are supported.');
  const fileRef = ref(storage, `resources/${subject}/${Date.now()}-${file.name}`);
  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);
  return addDoc(collection(db, 'resources'), {
    title,
    subject,
    type,
    fileType: file.type,
    url,
    createdBy: createdBy || null,
    createdAt: serverTimestamp(),
  });
}

export async function createAnnouncement(payload) {
  if (!db) throw new Error('Firebase is not configured yet.');
  return addDoc(collection(db, 'announcements'), { ...payload, createdAt: serverTimestamp() });
}
