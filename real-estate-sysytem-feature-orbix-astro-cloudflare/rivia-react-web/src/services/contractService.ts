import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from './firebase';
import type { Contract } from '../types/models';

function fromContractDoc(id: string, data: Record<string, unknown>, docPath?: string): Contract {
  return { id, docPath, ...(data as Omit<Contract, 'id'>) };
}

function mergeContracts(items: Contract[]): Contract[] {
  const map = new Map<string, Contract>();
  for (const item of items) map.set(item.id, item);
  return [...map.values()];
}

async function loadContractsByUser(uid: string): Promise<Contract[]> {
  try {
    const [customerSnap, ownerSnap] = await Promise.all([
      getDocs(query(collection(db, 'contracts'), where('customerUserId', '==', uid), limit(80))),
      getDocs(query(collection(db, 'contracts'), where('ownerUserId', '==', uid), limit(80))),
    ]);
    return mergeContracts([
      ...customerSnap.docs.map((item) => fromContractDoc(item.id, item.data(), item.ref.path)),
      ...ownerSnap.docs.map((item) => fromContractDoc(item.id, item.data(), item.ref.path)),
    ]);
  } catch {
    const snap = await getDocs(query(collection(db, 'contracts'), limit(120)));
    return snap.docs
      .map((item) => fromContractDoc(item.id, item.data(), item.ref.path))
      .filter((item) => item.customerUserId === uid || item.ownerUserId === uid);
  }
}

export async function getMyContracts(uid: string): Promise<Contract[]> {
  return loadContractsByUser(uid);
}

export async function getAllContracts(max = 120): Promise<Contract[]> {
  const snap = await getDocs(query(collection(db, 'contracts'), limit(max)));
  return snap.docs.map((item) => fromContractDoc(item.id, item.data(), item.ref.path));
}

export async function getContractById(id: string): Promise<Contract | null> {
  const snap = await getDoc(doc(db, 'contracts', id));
  if (!snap.exists()) return null;
  return fromContractDoc(snap.id, snap.data(), snap.ref.path);
}
