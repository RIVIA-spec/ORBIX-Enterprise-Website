import { addDoc, collection, deleteDoc, doc, getDocs, limit, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Category } from '../types/models';

export async function getCategories(max = 100): Promise<Category[]> {
  const snap = await getDocs(query(collection(db, 'property_category'), limit(max)));
  return snap.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<Category, 'id'>) }));
}

export async function createCategory(title: string): Promise<void> {
  await addDoc(collection(db, 'property_category'), { title, created_at: serverTimestamp() });
}

export async function updateCategory(id: string, title: string): Promise<void> {
  await updateDoc(doc(db, 'property_category', id), { title, updatedAt: serverTimestamp() });
}

export async function deleteCategory(id: string): Promise<void> {
  await deleteDoc(doc(db, 'property_category', id));
}
