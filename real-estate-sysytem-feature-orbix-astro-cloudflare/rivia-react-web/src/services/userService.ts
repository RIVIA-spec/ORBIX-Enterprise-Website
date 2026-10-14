import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from './firebase';
import type { UserProfile } from '../types/models';

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { uid, ...(snap.data() as Omit<UserProfile, 'uid'>) };
}

export async function createUserProfile(user: User, username: string): Promise<void> {
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    username,
    email: user.email ?? '',
    isActive: true,
    isVerified: false,
    created_at: serverTimestamp(),
  });
}
