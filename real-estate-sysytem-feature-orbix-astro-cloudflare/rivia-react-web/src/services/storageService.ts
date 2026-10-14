import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';

function safeFileName(file: File) {
  const cleaned = file.name.replace(/[^\w.-]+/g, '-');
  return `${Date.now()}-${cleaned}`;
}

export async function uploadFile(path: string, file: File): Promise<string> {
  const uploadRef = ref(storage, path);
  const snap = await uploadBytes(uploadRef, file);
  return getDownloadURL(snap.ref);
}

export async function uploadPropertyImage(uid: string, file: File): Promise<string> {
  return uploadFile(`properties/${uid}/property_images/${safeFileName(file)}`, file);
}

export async function uploadPanoramaImage(uid: string, file: File): Promise<{ url: string; path: string }> {
  const path = `properties/${uid}/panorama_tours/${safeFileName(file)}`;
  return {
    path,
    url: await uploadFile(path, file),
  };
}

export async function uploadVerificationImage(uid: string, side: 'front' | 'back', file: File): Promise<string> {
  return uploadFile(`id_verifications/${uid}/${side}`, file);
}

export async function uploadAdImage(file: File): Promise<string> {
  return uploadFile(`ads/${safeFileName(file)}`, file);
}
