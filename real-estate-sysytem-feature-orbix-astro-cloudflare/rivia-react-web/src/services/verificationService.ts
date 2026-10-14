import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Verification } from '../types/models';

export async function getVerification(uid: string): Promise<Verification | null> {
  const snap = await getDoc(doc(db, 'verifications', uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<Verification, 'id'>) };
}

export async function submitVerification(input: Pick<Verification, 'userId' | 'frontIdUrl' | 'backIdUrl'>): Promise<void> {
  if (!input.userId) {
    throw new Error('missing-user-id');
  }
  await setDoc(
    doc(db, 'verifications', input.userId),
    {
      ...input,
      status: 'pending',
      submittedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
