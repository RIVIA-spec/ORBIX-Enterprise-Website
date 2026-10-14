import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, db, storage } from './firebase';
import type { HeroSlide } from '../types/models';

const COLLECTION = 'home_hero_slides';
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

type HeroSlideInput = Partial<Omit<HeroSlide, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>>;

function safeFileName(file: File) {
  const cleaned = file.name.replace(/[^\w.-]+/g, '-');
  return `${Date.now()}-${cleaned}`;
}

function timestampToMillis(value: unknown) {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value === 'object') {
    const maybeTimestamp = value as { toDate?: () => Date; seconds?: number };
    if (typeof maybeTimestamp.toDate === 'function') return maybeTimestamp.toDate().getTime();
    if (typeof maybeTimestamp.seconds === 'number') return maybeTimestamp.seconds * 1000;
  }
  return 0;
}

function sortSlides(slides: HeroSlide[]) {
  return [...slides].sort((a, b) => {
    const orderDiff = Number(a.order ?? 0) - Number(b.order ?? 0);
    if (orderDiff !== 0) return orderDiff;
    return timestampToMillis(b.createdAt) - timestampToMillis(a.createdAt);
  });
}

function toHeroSlide(snapshotId: string, data: DocumentData): HeroSlide {
  return {
    id: snapshotId,
    imageUrl: String(data.imageUrl || ''),
    storagePath: typeof data.storagePath === 'string' ? data.storagePath : undefined,
    title: typeof data.title === 'string' ? data.title : undefined,
    subtitle: typeof data.subtitle === 'string' ? data.subtitle : undefined,
    badge: typeof data.badge === 'string' ? data.badge : undefined,
    linkLabel: typeof data.linkLabel === 'string' ? data.linkLabel : undefined,
    linkUrl: typeof data.linkUrl === 'string' ? data.linkUrl : undefined,
    order: Number(data.order ?? 0),
    isActive: data.isActive === true,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    createdBy: typeof data.createdBy === 'string' ? data.createdBy : undefined,
    updatedBy: typeof data.updatedBy === 'string' ? data.updatedBy : undefined,
  };
}

function validateHeroImage(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_IMAGE_TYPES.includes(file.type) || !ALLOWED_EXTENSIONS.includes(extension)) {
    throw new Error('يرجى رفع صورة بصيغة jpg أو jpeg أو png أو webp.');
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error('حجم صورة الهيرو يجب ألا يتجاوز 5MB.');
  }
}

async function uploadHeroImage(slideId: string, file: File) {
  validateHeroImage(file);
  const storagePath = `home/hero-slides/${slideId}/${safeFileName(file)}`;
  try {
    const uploadRef = ref(storage, storagePath);
    const snapshot = await uploadBytes(uploadRef, file);
    const imageUrl = await getDownloadURL(snapshot.ref);
    return { imageUrl, storagePath };
  } catch (error) {
    throw mapHeroSlideError(error, 'storage');
  }
}

function currentUid() {
  return auth.currentUser?.uid;
}

function mapHeroSlideError(error: unknown, scope: 'firestore' | 'storage' = 'firestore') {
  if (error instanceof Error && !('code' in error)) return error;
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: unknown }).code) : '';
  if (code.includes('permission-denied') || code.includes('unauthorized')) {
    return new Error(
      scope === 'storage'
        ? 'تعذر رفع صورة الهيرو بسبب صلاحيات التخزين.'
        : 'تعذر حفظ صور الهيرو بسبب صلاحيات قاعدة البيانات.',
    );
  }
  return error instanceof Error ? error : new Error('تعذر تنفيذ العملية. حاول مرة أخرى.');
}

export async function listActiveHeroSlides() {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION));
    const slides = snapshot.docs
      .map((item) => toHeroSlide(item.id, item.data()))
      .filter((slide) => slide.isActive === true && Boolean(slide.imageUrl));
    return sortSlides(slides);
  } catch (error) {
    throw mapHeroSlideError(error);
  }
}

export async function listAllHeroSlidesForAdmin() {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION));
    return sortSlides(snapshot.docs.map((item) => toHeroSlide(item.id, item.data())));
  } catch (error) {
    throw mapHeroSlideError(error);
  }
}

export async function createHeroSlide(data: HeroSlideInput, imageFile?: File) {
  const slideRef = doc(collection(db, COLLECTION));
  try {
    const upload = imageFile ? await uploadHeroImage(slideRef.id, imageFile) : null;
    const now = serverTimestamp();
    await setDoc(slideRef, {
      imageUrl: upload?.imageUrl || data.imageUrl || '',
      storagePath: upload?.storagePath || data.storagePath || '',
      title: data.title || '',
      subtitle: data.subtitle || '',
      badge: data.badge || '',
      linkLabel: data.linkLabel || '',
      linkUrl: data.linkUrl || '',
      order: Number(data.order ?? 0),
      isActive: data.isActive === true,
      createdAt: now,
      updatedAt: now,
      createdBy: currentUid() || '',
      updatedBy: currentUid() || '',
    });
    return slideRef.id;
  } catch (error) {
    throw mapHeroSlideError(error);
  }
}

export async function updateHeroSlide(id: string, data: HeroSlideInput, imageFile?: File) {
  try {
    const upload = imageFile ? await uploadHeroImage(id, imageFile) : null;
    const payload: Record<string, unknown> = {
      ...data,
      order: Number(data.order ?? 0),
      isActive: data.isActive === true,
      updatedAt: serverTimestamp(),
      updatedBy: currentUid() || '',
    };
    if (upload) {
      payload.imageUrl = upload.imageUrl;
      payload.storagePath = upload.storagePath;
    }
    await updateDoc(doc(db, COLLECTION, id), payload);
  } catch (error) {
    throw mapHeroSlideError(error);
  }
}

export async function deleteHeroSlide(id: string) {
  try {
    await deleteDoc(doc(db, COLLECTION, id));
  } catch (error) {
    throw mapHeroSlideError(error);
  }
}

export async function toggleHeroSlideActive(id: string, isActive: boolean) {
  try {
    await updateDoc(doc(db, COLLECTION, id), {
      isActive,
      updatedAt: serverTimestamp(),
      updatedBy: currentUid() || '',
    });
  } catch (error) {
    throw mapHeroSlideError(error);
  }
}

export async function reorderHeroSlides(items: Array<{ id: string; order: number }>) {
  try {
    const batch = writeBatch(db);
    items.forEach((item) => {
      batch.update(doc(db, COLLECTION, item.id), {
        order: Number(item.order) || 0,
        updatedAt: serverTimestamp(),
        updatedBy: currentUid() || '',
      });
    });
    await batch.commit();
  } catch (error) {
    throw mapHeroSlideError(error);
  }
}
