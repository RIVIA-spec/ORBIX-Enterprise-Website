import { deleteDoc, doc, getDocs, collection, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Favorite } from '../types/models';

export async function getFavorites(uid: string): Promise<Favorite[]> {
  const snap = await getDocs(collection(db, 'users', uid, 'favorites'));
  return snap.docs.map((item) => ({
    id: item.id,
    propertyId: item.id,
    ...(item.data() as Omit<Favorite, 'propertyId'>),
  })) as Favorite[];
}

export async function addFavorite(uid: string, propertyId: string): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'favorites', propertyId), {
    added_at: serverTimestamp(),
  });
}

export async function removeFavorite(uid: string, propertyId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'favorites', propertyId));
}

export async function toggleFavorite(uid: string, propertyId: string, active: boolean): Promise<void> {
  if (active) {
    await removeFavorite(uid, propertyId);
  } else {
    await addFavorite(uid, propertyId);
  }
}
