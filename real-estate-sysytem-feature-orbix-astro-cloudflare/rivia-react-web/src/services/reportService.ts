import { addDoc, collection, getDocs, limit, query, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { ReportReason } from '../types/models';

export async function getReportReasons(): Promise<ReportReason[]> {
  try {
    const snap = await getDocs(query(collection(db, 'report_reasons'), limit(80)));
    return snap.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<ReportReason, 'id'>) }));
  } catch {
    return [];
  }
}

export async function reportProperty(input: {
  propertyId: string;
  reporterId: string;
  reasonText: string;
  reasonId?: string;
}): Promise<void> {
  await addDoc(collection(db, 'property_reports'), {
    propertyId: input.propertyId,
    property_id: input.propertyId,
    reporterId: input.reporterId,
    reporter_id: input.reporterId,
    reasonId: input.reasonId || '',
    reason_text: input.reasonText,
    status: 'pending',
    reported_at: serverTimestamp(),
    created_at: serverTimestamp(),
  });
}

export async function reportHotel(input: {
  hotelId: string;
  reporterId: string;
  reasonText: string;
  reasonId?: string;
  reasonIds?: string[];
}): Promise<void> {
  await addDoc(collection(db, 'hotel_reports'), {
    hotelId: input.hotelId,
    hotel_id: input.hotelId,
    reporterId: input.reporterId,
    reporter_id: input.reporterId,
    reasonId: input.reasonId || '',
    reason_ids: input.reasonIds || (input.reasonId ? [input.reasonId] : []),
    reason_text: input.reasonText,
    reasonText: input.reasonText,
    status: 'pending',
    reported_at: serverTimestamp(),
    created_at: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
}
