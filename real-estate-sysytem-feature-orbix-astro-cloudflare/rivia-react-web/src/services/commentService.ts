import { addDoc, collection, deleteDoc, doc, getDocs, limit, query, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { PropertyComment } from '../types/models';

export async function getPropertyComments(propertyId: string): Promise<PropertyComment[]> {
  const snap = await getDocs(query(collection(db, 'properties', propertyId, 'comments'), limit(80)));
  return snap.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<PropertyComment, 'id'>) }));
}

export async function createPropertyComment(
  propertyId: string,
  input: Pick<PropertyComment, 'userId' | 'userName' | 'comment' | 'hasBooked'>,
): Promise<void> {
  await addDoc(collection(db, 'properties', propertyId, 'comments'), {
    ...input,
    createdAt: serverTimestamp(),
  });
}

export async function deletePropertyComment(propertyId: string, commentId: string): Promise<void> {
  await deleteDoc(doc(db, 'properties', propertyId, 'comments', commentId));
}

