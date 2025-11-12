// Importações do Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Configuração do Firebase usando variáveis de ambiente
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Inicializa o Firebase
export const app = initializeApp(firebaseConfig);

// Inicializa e exporta os serviços
export const db = getFirestore(app);
export const storage = getStorage(app);

// Exporta os tipos necessários
export type {
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';

// Re-exporta funções comumente usadas
export {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  writeBatch,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';

export {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';

// Re-exporta funções do whatsappService para evitar imports diretos
export {
  getGreeting,
  getResumo,
  getMotivacao,
  preloadAllMessages,
  clearMessageCache,
  getMessageById,
  isCacheExpired,
  getCacheStats,
  testFirebaseConnection,
  getTituloLimpoParaMensagem
} from '../../../utils/whatsappService'; 