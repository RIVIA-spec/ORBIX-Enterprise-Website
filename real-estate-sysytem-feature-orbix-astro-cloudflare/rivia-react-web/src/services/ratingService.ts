import { collection, doc, getDocs, limit, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { PropertyRating } from '../types/models';

export async function getPropertyRatings(propertyId: string): Promise<PropertyRating[]> {
  const snap = await getDocs(query(collection(db, 'properties', propertyId, 'ratings'), limit(120)));
  return snap.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<PropertyRating, 'id'>) }));
}

export async function setPropertyRating(propertyId: string, uid: string, rating: number): Promise<void> {
  await setDoc(
    doc(db, 'properties', propertyId, 'ratings', uid),
    {
      userId: uid,
      rating,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export function getRatingSummary(ratings: PropertyRating[]) {
  const valid = ratings.map((item) => Number(item.rating)).filter((item) => Number.isFinite(item) && item > 0);
  const count = valid.length;
  const average = count ? valid.reduce((sum, item) => sum + item, 0) / count : 0;
  return { count, average };
}

