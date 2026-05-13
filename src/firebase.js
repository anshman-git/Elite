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
      callback({ ...sessionUser, ...(profile.exists() ? profile.data() : {}) });
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
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name });
  await setDoc(doc(db, 'users', credential.user.uid), {
    name,
    email,
    role: 'student',
    streak: 1,
    points: 0,
    createdAt: serverTimestamp(),
  });
  return credential;
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
