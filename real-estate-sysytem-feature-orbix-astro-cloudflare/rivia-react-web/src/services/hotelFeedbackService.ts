import { collection, doc, getDocs, limit, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { HotelComment, HotelRating } from '../types/models';

// Flutter's shared hotel widgets currently use the property feedback paths with the hotel id.
function hotelCommentsCollection(hotelId: string) {
  return collection(db, 'properties', hotelId, 'comments');
}

function hotelRatingsCollection(hotelId: string) {
  return collection(db, 'properties', hotelId, 'ratings');
}

export async function listHotelComments(hotelId: string): Promise<HotelComment[]> {
  const snap = await getDocs(query(hotelCommentsCollection(hotelId), limit(80)));
  return snap.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<HotelComment, 'id'>) }));
}

export async function addHotelComment(
  hotelId: string,
  payload: Pick<HotelComment, 'userId' | 'userName' | 'userPhotoURL' | 'comment'>,
): Promise<void> {
  const commentRef = doc(hotelCommentsCollection(hotelId));
  await setDoc(commentRef, {
    id: commentRef.id,
    hotelId,
    ...payload,
    hasBooked: false,
    status: 'visible',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function listHotelRatings(hotelId: string): Promise<HotelRating[]> {
  const snap = await getDocs(query(hotelRatingsCollection(hotelId), limit(120)));
  return snap.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<HotelRating, 'id'>) }));
}

export async function upsertHotelRating(
  hotelId: string,
  userId: string,
  payload: Pick<HotelRating, 'userName' | 'rating'>,
): Promise<void> {
  await setDoc(
    doc(db, 'properties', hotelId, 'ratings', userId),
    {
      hotelId,
      userId,
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export function getHotelRatingSummary(ratings: HotelRating[]) {
  const valid = ratings.map((item) => Number(item.rating)).filter((item) => Number.isFinite(item) && item >= 1 && item <= 5);
  const count = valid.length;
  const average = count ? valid.reduce((sum, item) => sum + item, 0) / count : 0;
  return { count, average };
}
