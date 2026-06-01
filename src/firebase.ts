import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  addDoc, 
  writeBatch,
  deleteDoc,
  DocumentData,
  onSnapshot
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore
// In multi-database environments, the default instance might need to use the specified firestoreDatabaseId if configured
export const db = getFirestore(app);

// Helper error tracker
export interface FirestoreErrorInfo {
  code?: string;
  message: string;
  operation: string;
  collection: string;
}

export function handleFirestoreError(err: any, operation: string, collectionName: string) {
  console.error(`Firestore Error [${operation}] in ${collectionName}:`, err);
  const info: FirestoreErrorInfo = {
    code: err?.code,
    message: err?.message || 'Unknown Firestore Exception',
    operation,
    collection: collectionName
  };
  return info;
}
