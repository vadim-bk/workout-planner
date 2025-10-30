import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, collection, doc, query, getDocs, getDoc, addDoc, updateDoc } from 'firebase/firestore';
import type { QueryConstraint } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const collectionRef = (path: string) => collection(db, path);
export const documentRef = (path: string, id: string) => doc(db, path, id);

export const getCollectionDocs = (path: string, ...constraints: QueryConstraint[]) => {
  const q = query(collection(db, path), ...constraints);
  return getDocs(q);
};

export const getDocument = (path: string, id: string) => getDoc(doc(db, path, id));

export const addDocument = <T extends Record<string, unknown>>(path: string, data: T) => {
  return addDoc(collection(db, path), data);
};

export const updateDocument = <T extends Record<string, unknown>>(path: string, id: string, data: T) => {
  return updateDoc(doc(db, path, id), data);
};
