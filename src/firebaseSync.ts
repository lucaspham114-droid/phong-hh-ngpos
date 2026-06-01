import { doc, setDoc, getDoc } from "firebase/firestore";
import { db, handleFirestoreError } from "./firebase";

/**
 * Interface representing the unified POS snapshot structure for Firestore.
 */
export interface ShopBackupPayload {
  userId: string;
  updatedAt: string;
  meta: {
    exporter: string;
    exportedAt: string;
    itemsCount: {
      products: number;
      inventory: number;
      customers: number;
      suppliers: number;
      invoices: number;
      importSlips: number;
      staffs: number;
    };
  };
  products: any[];
  inventory: any[];
  customers: any[];
  suppliers: any[];
  invoices: any[];
  importSlips: any[];
  staffs: any[];
  settings: any;
  securityLogs: any[];
}

/**
 * Saves/Overwrites the POS snapshot in Cloud Firestore for the authenticated user.
 */
export async function backupToFirestore(userId: string, data: Omit<ShopBackupPayload, "userId" | "updatedAt">): Promise<void> {
  const path = `shops/${userId}`;
  try {
    const payload: ShopBackupPayload = {
      userId,
      updatedAt: new Date().toISOString(),
      ...data,
    };
    await setDoc(doc(db, "shops", userId), payload);
  } catch (err: any) {
    const errInfo = handleFirestoreError(err, "write", path);
    throw new Error(JSON.stringify(errInfo));
  }
}

/**
 * Retrieves the POS snapshot from Cloud Firestore for the authenticated user.
 */
export async function restoreFromFirestore(userId: string): Promise<ShopBackupPayload | null> {
  const path = `shops/${userId}`;
  try {
    const docSnap = await getDoc(doc(db, "shops", userId));
    if (docSnap.exists()) {
      return docSnap.data() as ShopBackupPayload;
    }
    return null;
  } catch (err: any) {
    const errInfo = handleFirestoreError(err, "get", path);
    throw new Error(JSON.stringify(errInfo));
  }
}
