// Importações do Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAJwTE_5lajcClq-RYP8OvcO6m4xsrTvZY",
  authDomain: "instrutores-2ae1b.firebaseapp.com",
  projectId: "instrutores-2ae1b",
  storageBucket: "instrutores-2ae1b.firebasestorage.app",
  messagingSenderId: "171421264705",
  appId: "1:171421264705:android:762c47a20dcf60e88f8fc0",
};

// Inicializa o Firebase
export const app = initializeApp(firebaseConfig);

// Inicializa e exporta os serviços
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Exporta os tipos necessários
export type {
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';

export type {
  User,
  UserCredential,
} from 'firebase/auth';

// Re-exporta funções comumente usadas
export {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';

export {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage'; 