import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  writeBatch,
  getDoc
} from "firebase/firestore";
import { db } from "./firebase";
import { 
  Product, 
  InventoryItem, 
  Customer, 
  Supplier, 
  Invoice, 
  ImportSlip, 
  Staff, 
  SecurityLog, 
  SystemSettings 
} from "./types";

// Save a single product
export async function saveProductToFirebase(p: Product) {
  try {
    await setDoc(doc(db, "products", p.maSP), p);
  } catch (err) {
    console.error("Error saving product to Firebase", err);
  }
}

// Save a single inventory item
export async function saveInventoryToFirebase(item: InventoryItem) {
  try {
    await setDoc(doc(db, "inventory", item.maSP), item);
  } catch (err) {
    console.error("Error saving inventory item to Firebase", err);
  }
}

// Save a single customer
export async function saveCustomerToFirebase(c: Customer) {
  try {
    await setDoc(doc(db, "customers", c.maKH), c);
  } catch (err) {
    console.error("Error saving customer to Firebase", err);
  }
}

// Save a single supplier
export async function saveSupplierToFirebase(s: Supplier) {
  try {
    await setDoc(doc(db, "suppliers", s.maNCC), s);
  } catch (err) {
    console.error("Error saving supplier to Firebase", err);
  }
}

// Save a single invoice
export async function saveInvoiceToFirebase(invoice: Invoice) {
  try {
    await setDoc(doc(db, "invoices", invoice.maHD), invoice);
  } catch (err) {
    console.error("Error saving invoice to Firebase", err);
  }
}

// Save a single import slip
export async function saveImportSlipToFirebase(slip: ImportSlip) {
  try {
    await setDoc(doc(db, "importSlips", slip.maPN), slip);
  } catch (err) {
    console.error("Error saving import slip to Firebase", err);
  }
}

// Save a single staff
export async function saveStaffToFirebase(staff: Staff) {
  try {
    await setDoc(doc(db, "staffs", staff.id), staff);
  } catch (err) {
    console.error("Error saving staff to Firebase", err);
  }
}

// Save a security log
export async function saveSecurityLogToFirebase(log: SecurityLog) {
  try {
    await setDoc(doc(db, "securityLogs", log.id), log);
  } catch (err) {
    console.error("Error saving security log to Firebase", err);
  }
}

// Save global settings
export async function saveSettingsToFirebase(settings: SystemSettings) {
  try {
    await setDoc(doc(db, "settings", "global"), settings);
  } catch (err) {
    console.error("Error saving settings to Firebase", err);
  }
}

// Batch bootstrap seed data to Firebase if collections empty
export async function seedFirebaseIfEmpty(
  products: Product[],
  inventory: InventoryItem[],
  customers: Customer[],
  suppliers: Supplier[],
  invoices: Invoice[],
  importSlips: ImportSlip[],
  staffs: Staff[],
  securityLogs: SecurityLog[],
  settings: SystemSettings
) {
  try {
    console.log("Checking if Firebase requires seeding...");
    const prodSnap = await getDocs(collection(db, "products"));
    
    if (prodSnap.empty) {
      console.log("Firebase database is empty, bootstrapping seed data...");
      
      const batch = writeBatch(db);
      
      products.forEach(p => {
        batch.set(doc(db, "products", p.maSP), p);
      });
      
      inventory.forEach(item => {
        batch.set(doc(db, "inventory", item.maSP), item);
      });
      
      customers.forEach(c => {
        batch.set(doc(db, "customers", c.maKH), c);
      });
      
      suppliers.forEach(s => {
        batch.set(doc(db, "suppliers", s.maNCC), s);
      });
      
      invoices.forEach(inv => {
        batch.set(doc(db, "invoices", inv.maHD), inv);
      });
      
      importSlips.forEach(slip => {
        batch.set(doc(db, "importSlips", slip.maPN), slip);
      });
      
      staffs.forEach(staff => {
        batch.set(doc(db, "staffs", staff.id), staff);
      });
      
      securityLogs.forEach(log => {
        batch.set(doc(db, "securityLogs", log.id), log);
      });
      
      batch.set(doc(db, "settings", "global"), settings);
      
      await batch.commit();
      console.log("Firebase bootstrap seeding complete!");
      return true;
    }
    
    console.log("Firebase is already seeded.");
    return false;
  } catch (err) {
    console.error("Error seeding Firebase data:", err);
    return false;
  }
}

// Fetch all elements from Firebase
export async function pullAllFromFirebase() {
  try {
    const [
      prodSnap, 
      invSnap, 
      custSnap, 
      suppSnap, 
      invListSnap, 
      slipSnap, 
      staffSnap, 
      logSnap, 
      setDocSnap
    ] = await Promise.all([
      getDocs(collection(db, "products")),
      getDocs(collection(db, "inventory")),
      getDocs(collection(db, "customers")),
      getDocs(collection(db, "suppliers")),
      getDocs(collection(db, "invoices")),
      getDocs(collection(db, "importSlips")),
      getDocs(collection(db, "staffs")),
      getDocs(collection(db, "securityLogs")),
      getDoc(doc(db, "settings", "global"))
    ]);

    const res = {
      products: prodSnap.docs.map(d => d.data() as Product),
      inventory: invSnap.docs.map(d => d.data() as InventoryItem),
      customers: custSnap.docs.map(d => d.data() as Customer),
      suppliers: suppSnap.docs.map(d => d.data() as Supplier),
      invoices: invListSnap.docs.map(d => d.data() as Invoice),
      importSlips: slipSnap.docs.map(d => d.data() as ImportSlip),
      staffs: staffSnap.docs.map(d => d.data() as Staff),
      securityLogs: logSnap.docs.map(d => d.data() as SecurityLog),
      settings: setDocSnap.exists() ? (setDocSnap.data() as SystemSettings) : null
    };
    return res;
  } catch (err) {
    console.error("Error pulling all records from Firebase:", err);
    return null;
  }
}
