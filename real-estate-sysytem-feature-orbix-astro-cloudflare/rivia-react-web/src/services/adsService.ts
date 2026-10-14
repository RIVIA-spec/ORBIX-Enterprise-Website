import { addDoc, collection, deleteDoc, doc, getDocs, limit, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Ad } from '../types/models';

export async function getAds(max = 80): Promise<Ad[]> {
  const snap = await getDocs(query(collection(db, 'ads'), limit(max)));
  return snap.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<Ad, 'id'>) }));
}

export async function createAd(input: Omit<Ad, 'id' | 'created_at'>): Promise<void> {
  await addDoc(collection(db, 'ads'), { ...input, created_at: serverTimestamp() });
}

export async function updateAd(id: string, fields: Partial<Ad>): Promise<void> {
  await updateDoc(doc(db, 'ads', id), { ...fields, updatedAt: serverTimestamp() });
}

export async function deleteAd(id: string): Promise<void> {
  await deleteDoc(doc(db, 'ads', id));
}

