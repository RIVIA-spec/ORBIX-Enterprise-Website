import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import type { App } from 'firebase-admin/app';
import { FieldValue, getFirestore, Timestamp, type DocumentData, type Query } from 'firebase-admin/firestore';
import { FIREBASE_APP } from '../../firebase/firebase.constants';
import type { Lead, LeadType } from '../domain/lead';
import type { LeadRepository } from '../domain/lead.repository';

@Injectable()
export class FirestoreLeadRepository implements LeadRepository {
  private readonly collection;

  constructor(@Inject(FIREBASE_APP) app: App) {
    this.collection = getFirestore(app).collection('leads');
  }

  async create(lead: Lead): Promise<Lead> {
    await this.collection.doc(lead.id).set(clean({ ...lead, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }));
    return lead;
  }

  async findById(id: string): Promise<Lead | null> {
    const snapshot = await this.collection.doc(id).get();
    return snapshot.exists ? fromDoc(snapshot.id, snapshot.data() ?? {}) : null;
  }

  async findRecentDuplicate(customerUid: string, type: LeadType, propertyId?: string, since?: Date): Promise<Lead | null> {
    let query: Query = this.collection.where('customerUid', '==', customerUid).where('type', '==', type);
    if (propertyId) query = query.where('propertyId', '==', propertyId);
    if (since) query = query.where('createdAt', '>=', since);
    const snapshot = await query.limit(1).get();
    const doc = snapshot.docs[0];
    return doc ? fromDoc(doc.id, doc.data()) : null;
  }

  async listByCustomer(customerUid: string, limit: number, cursor?: string): Promise<{ items: Lead[]; nextCursor?: string }> {
    let query: Query = this.collection.where('customerUid', '==', customerUid).orderBy('__name__').limit(limit);
    if (cursor) query = query.startAfter(cursor);
    const snapshot = await query.get();
    const items = snapshot.docs.map((doc) => fromDoc(doc.id, doc.data()));
    return { items, nextCursor: items.length === limit ? items.at(-1)?.id : undefined };
  }

  async listByPartner(partnerId: string, limit: number, cursor?: string): Promise<{ items: Lead[]; nextCursor?: string }> {
    let query: Query = this.collection.where('partnerId', '==', partnerId).orderBy('__name__').limit(limit);
    if (cursor) query = query.startAfter(cursor);
    const snapshot = await query.get();
    const items = snapshot.docs.map((doc) => fromDoc(doc.id, doc.data()));
    return { items, nextCursor: items.length === limit ? items.at(-1)?.id : undefined };
  }

  async save(lead: Lead): Promise<Lead> {
    await this.collection.doc(lead.id).set(clean({ ...lead, updatedAt: FieldValue.serverTimestamp() }), { merge: true });
    return lead;
  }
}

function toDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return new Date(String(value));
}

function fromDoc(id: string, data: DocumentData): Lead {
  return {
    id,
    type: data.type,
    propertyId: data.propertyId,
    customerUid: data.customerUid,
    partnerId: data.partnerId,
    assignedToUid: data.assignedToUid,
    name: data.name,
    phone: data.phone,
    email: data.email,
    message: data.message,
    source: data.source,
    status: data.status,
    createdAt: toDate(data.createdAt) ?? new Date(),
    updatedAt: toDate(data.updatedAt) ?? new Date(),
    contactedAt: toDate(data.contactedAt),
    closedAt: toDate(data.closedAt)
  };
}

function clean(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}
