import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Branch } from '../types/organization';

export type BranchInput = Pick<Branch, 'organizationId' | 'name'> &
  Partial<Pick<Branch, 'city' | 'address' | 'phone' | 'status' | 'managerUserId'>>;

function fromBranchDoc(id: string, data: Record<string, unknown>): Branch {
  return { id, ...(data as Omit<Branch, 'id'>) };
}

export async function listBranches(organizationId: string): Promise<Branch[]> {
  const snap = await getDocs(query(collection(db, 'branches'), where('organizationId', '==', organizationId)));
  return snap.docs.map((item) => fromBranchDoc(item.id, item.data()));
}

export async function createBranch(input: BranchInput): Promise<string> {
  const branchRef = doc(collection(db, 'branches'));
  await setDoc(branchRef, {
    organizationId: input.organizationId,
    name: input.name,
    city: input.city || '',
    address: input.address || '',
    phone: input.phone || '',
    status: input.status || 'active',
    managerUserId: input.managerUserId || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return branchRef.id;
}

export async function updateBranch(
  branchId: string,
  fields: Partial<Pick<Branch, 'name' | 'city' | 'address' | 'phone' | 'status' | 'managerUserId'>>,
): Promise<void> {
  await updateDoc(doc(db, 'branches', branchId), {
    ...fields,
    updatedAt: serverTimestamp(),
  });
}
