import { collection, doc, getDocs, limit, query, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { AppNotification } from '../types/models';

export async function getNotifications(uid: string): Promise<AppNotification[]> {
  const snap = await getDocs(query(collection(db, 'users', uid, 'notifications'), limit(80)));
  return snap.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<AppNotification, 'id'>) }));
}

export async function markNotificationRead(uid: string, notificationId: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid, 'notifications', notificationId), {
    isRead: true,
    read: true,
  });
}

