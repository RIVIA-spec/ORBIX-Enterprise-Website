import { addDoc, collection, doc, getDoc, getDocs, limit, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import type { Invoice } from '../types/models';

function fromInvoiceDoc(id: string, data: Record<string, unknown>, docPath?: string): Invoice {
  return { id, docPath, ...(data as Omit<Invoice, 'id'>) };
}

function mergeInvoices(items: Invoice[]): Invoice[] {
  const map = new Map<string, Invoice>();
  for (const item of items) map.set(item.id, item);
  return [...map.values()];
}

async function loadInvoicesByUser(uid: string): Promise<Invoice[]> {
  try {
    const [customerSnap, ownerSnap] = await Promise.all([
      getDocs(query(collection(db, 'invoices'), where('customerUserId', '==', uid), limit(80))),
      getDocs(query(collection(db, 'invoices'), where('ownerUserId', '==', uid), limit(80))),
    ]);
    return mergeInvoices([
      ...customerSnap.docs.map((item) => fromInvoiceDoc(item.id, item.data(), item.ref.path)),
      ...ownerSnap.docs.map((item) => fromInvoiceDoc(item.id, item.data(), item.ref.path)),
    ]);
  } catch {
    const snap = await getDocs(query(collection(db, 'invoices'), limit(120)));
    return snap.docs
      .map((item) => fromInvoiceDoc(item.id, item.data(), item.ref.path))
      .filter((item) => item.customerUserId === uid || item.ownerUserId === uid);
  }
}

export async function getMyInvoices(uid: string): Promise<Invoice[]> {
  return loadInvoicesByUser(uid);
}

export async function getAllInvoices(max = 120): Promise<Invoice[]> {
  const snap = await getDocs(query(collection(db, 'invoices'), limit(max)));
  return snap.docs.map((item) => fromInvoiceDoc(item.id, item.data(), item.ref.path));
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  const snap = await getDoc(doc(db, 'invoices', id));
  if (!snap.exists()) return null;
  return fromInvoiceDoc(snap.id, snap.data(), snap.ref.path);
}

export async function createInvoice(input: {
  dealId: string;
  customerUserId: string;
  ownerUserId: string;
  amount: number;
  status?: string;
}): Promise<string> {
  const ref = await addDoc(collection(db, 'invoices'), {
    invoiceId: '',
    dealId: input.dealId,
    customerUserId: input.customerUserId,
    ownerUserId: input.ownerUserId,
    amount: input.amount,
    totalAmount: input.amount,
    status: input.status || 'pending',
    createdAt: serverTimestamp(),
    created_at: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await updateDoc(ref, { invoiceId: ref.id });
  return ref.id;
}

export async function updateInvoiceStatus(path: string | undefined, id: string, status: string): Promise<void> {
  await updateDoc(doc(db, path || `invoices/${id}`), { status, updatedAt: serverTimestamp() });
}
