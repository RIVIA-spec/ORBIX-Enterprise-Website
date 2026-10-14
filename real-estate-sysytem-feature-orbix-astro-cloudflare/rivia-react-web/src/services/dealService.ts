import { collection, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import type { Deal } from '../types/models';

function fromDealDoc(id: string, data: Record<string, unknown>, docPath?: string): Deal {
  return { id, docPath, ...(data as Omit<Deal, 'id'>) };
}

function mergeDeals(items: Deal[]): Deal[] {
  const map = new Map<string, Deal>();
  for (const item of items) {
    map.set(item.id, item);
  }
  return [...map.values()];
}

async function loadDealsByUser(uid: string): Promise<Deal[]> {
  try {
    const [customerSnap, ownerSnap] = await Promise.all([
      getDocs(query(collection(db, 'deals'), where('customerUserId', '==', uid), limit(80))),
      getDocs(query(collection(db, 'deals'), where('ownerUserId', '==', uid), limit(80))),
    ]);
    return mergeDeals([
      ...customerSnap.docs.map((item) => fromDealDoc(item.id, item.data(), item.ref.path)),
      ...ownerSnap.docs.map((item) => fromDealDoc(item.id, item.data(), item.ref.path)),
    ]);
  } catch {
    const snap = await getDocs(query(collection(db, 'deals'), limit(120)));
    return snap.docs
      .map((item) => fromDealDoc(item.id, item.data(), item.ref.path))
      .filter((item) => item.customerUserId === uid || item.ownerUserId === uid);
  }
}

export async function getMyDeals(uid: string): Promise<Deal[]> {
  return loadDealsByUser(uid);
}

export async function getAllDeals(max = 120): Promise<Deal[]> {
  const snap = await getDocs(query(collection(db, 'deals'), limit(max)));
  return snap.docs.map((item) => fromDealDoc(item.id, item.data(), item.ref.path));
}

export async function getDealById(id: string): Promise<Deal | null> {
  const snap = await getDoc(doc(db, 'deals', id));
  if (!snap.exists()) return null;
  return fromDealDoc(snap.id, snap.data(), snap.ref.path);
}

export async function createPurchaseDeal(input: {
  propertyId: string;
  propertyTitle?: string;
  propertyReference?: string;
  ownerUserId?: string;
  customerUserId: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  preferredContactMethod?: string;
  proposedPrice?: number | string | null;
  purchaseIntent?: string;
  note?: string;
}): Promise<Deal> {
  const dealRef = doc(collection(db, 'deals'));
  const payload = {
    dealId: dealRef.id,
    propertyId: input.propertyId,
    property_id: input.propertyId,
    propertyTitle: input.propertyTitle || '',
    property_title: input.propertyTitle || '',
    propertyReference: input.propertyReference || '',
    property_reference: input.propertyReference || '',
    ownerUserId: input.ownerUserId || '',
    customerUserId: input.customerUserId,
    customerName: input.customerName || '',
    customer_name: input.customerName || '',
    customerPhone: input.customerPhone || '',
    customer_phone: input.customerPhone || '',
    customerEmail: input.customerEmail || '',
    customer_email: input.customerEmail || '',
    preferredContactMethod: input.preferredContactMethod || 'phone',
    preferred_contact_method: input.preferredContactMethod || 'phone',
    dealType: 'purchase',
    listingType: 'property',
    purchaseIntent: input.purchaseIntent || 'شراء مباشر',
    purchase_intent: input.purchaseIntent || 'شراء مباشر',
    note: input.note || '',
    customerNote: input.note || '',
    customer_note: input.note || '',
    proposedPrice: input.proposedPrice ?? '',
    proposed_price: input.proposedPrice ?? '',
    totalAmount: input.proposedPrice ?? '',
    total_amount: input.proposedPrice ?? '',
    commissionTypeTitle: '',
    contractStatus: 'not_created',
    paymentStatus: 'unpaid',
    status: 'pending',
    createdAt: serverTimestamp(),
    created_at: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(dealRef, payload);
  return fromDealDoc(dealRef.id, payload, dealRef.path);
}

export async function updateDealFieldsByPath(path: string | undefined, id: string, fields: Record<string, unknown>): Promise<void> {
  await updateDoc(doc(db, path || `deals/${id}`), { ...fields, updatedAt: serverTimestamp() });
}

export async function updateDealStatus(path: string | undefined, id: string, status: string): Promise<void> {
  await updateDealFieldsByPath(path, id, { status });
}
