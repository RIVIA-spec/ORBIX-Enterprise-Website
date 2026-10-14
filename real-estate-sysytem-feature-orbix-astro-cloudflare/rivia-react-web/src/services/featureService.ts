import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

function normalizeFeatureList(data: Record<string, unknown>): string[] {
  const source = [data.list, data.values, data.items, data.features].find(Array.isArray);
  return Array.isArray(source) ? source.map(String).map((item) => item.trim()).filter(Boolean) : [];
}

export async function getFeatureList(): Promise<string[]> {
  const snap = await getDoc(doc(db, 'features', 'global'));
  if (!snap.exists()) return [];
  return normalizeFeatureList(snap.data());
}

export async function saveFeatureList(features: string[]): Promise<void> {
  const normalizedFeatures = features.map((item) => item.trim()).filter(Boolean);
  await setDoc(
    doc(db, 'features', 'global'),
    {
      list: normalizedFeatures,
      values: normalizedFeatures,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
