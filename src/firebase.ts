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
import { getAuth } from "firebase/auth";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firestore
// In multi-database environments, the default instance might need to use the specified firestoreDatabaseId if configured
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

// Helper error tracker compliant with structural system guidelines
export interface FirestoreErrorInfo {
  error: string;
  operationType: string;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(err: any, operationType: string, path: string | null): FirestoreErrorInfo {
  let authUser: any = null;
  try {
    const authInstance = getAuth(app);
    authUser = authInstance.currentUser;
  } catch (authErr) {
    console.warn("Could not retrieve auth instance for error context", authErr);
  }

  const errInfo: FirestoreErrorInfo = {
    error: err instanceof Error ? err.message : String(err),
    operationType,
    path,
    authInfo: {
      userId: authUser?.uid || null,
      email: authUser?.email || null,
      emailVerified: authUser?.emailVerified || null,
      isAnonymous: authUser?.isAnonymous || null,
      tenantId: authUser?.tenantId || null,
      providerInfo: authUser?.providerData?.map((p: any) => ({
        providerId: p.providerId,
        email: p.email,
      })) || [],
    },
  };

  console.error("Firestore Error Detailed Object: ", JSON.stringify(errInfo));
  return errInfo;
}
