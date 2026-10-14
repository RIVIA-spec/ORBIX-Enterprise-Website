import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import type { App } from 'firebase-admin/app';
import { FieldValue, getFirestore, Timestamp, type DocumentData, type Query } from 'firebase-admin/firestore';
import { FIREBASE_APP } from '../../firebase/firebase.constants';
import type { Property } from '../domain/property';
import type { PropertyRepository } from '../domain/property.repository';

@Injectable()
export class FirestorePropertyRepository implements PropertyRepository {
  private readonly collection;

  constructor(@Inject(FIREBASE_APP) app: App) {
    this.collection = getFirestore(app).collection('properties');
  }

  async create(property: Property): Promise<Property> {
    await this.collection.doc(property.id).set(clean({ ...property, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }));
    return property;
  }

  async findById(id: string): Promise<Property | null> {
    const snapshot = await this.collection.doc(id).get();
    return snapshot.exists ? fromDoc(snapshot.id, snapshot.data() ?? {}) : null;
  }

  async listPublished(limit: number, cursor?: string): Promise<{ items: Property[]; nextCursor?: string }> {
    let query: Query = this.collection.where('status', '==', 'published').orderBy('__name__').limit(limit);
    if (cursor) query = query.startAfter(cursor);
    const snapshot = await query.get();
    const items = snapshot.docs.map((doc) => fromDoc(doc.id, doc.data()));
    return { items, nextCursor: items.length === limit ? items.at(-1)?.id : undefined };
  }

  async listByPartner(partnerId: string, limit: number, cursor?: string): Promise<{ items: Property[]; nextCursor?: string }> {
    let query: Query = this.collection.where('partnerId', '==', partnerId).orderBy('__name__').limit(limit);
    if (cursor) query = query.startAfter(cursor);
    const snapshot = await query.get();
    const items = snapshot.docs.map((doc) => fromDoc(doc.id, doc.data()));
    return { items, nextCursor: items.length === limit ? items.at(-1)?.id : undefined };
  }

  async listPending(limit: number, cursor?: string): Promise<{ items: Property[]; nextCursor?: string }> {
    let query: Query = this.collection.where('status', '==', 'pending_review').orderBy('__name__').limit(limit);
    if (cursor) query = query.startAfter(cursor);
    const snapshot = await query.get();
    const items = snapshot.docs.map((doc) => fromDoc(doc.id, doc.data()));
    return { items, nextCursor: items.length === limit ? items.at(-1)?.id : undefined };
  }

  async save(property: Property): Promise<Property> {
    await this.collection.doc(property.id).set(clean({ ...property, updatedAt: FieldValue.serverTimestamp() }), { merge: true });
    return property;
  }
}

function toDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return new Date(String(value));
}

function fromDoc(id: string, data: DocumentData): Property {
  return {
    id,
    partnerId: data.partnerId,
    ownerUid: data.ownerUid,
    listingType: data.listingType,
    propertyType: data.propertyType,
    title: data.title,
    description: data.description,
    city: data.city,
    area: data.area,
    addressText: data.addressText,
    latitude: data.latitude,
    longitude: data.longitude,
    price: data.price,
    currency: data.currency,
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
    areaSize: data.areaSize,
    areaUnit: data.areaUnit,
    features: Array.isArray(data.features) ? data.features : [],
    mediaIds: Array.isArray(data.mediaIds) ? data.mediaIds : [],
    virtualTourId: data.virtualTourId,
    status: data.status,
    verificationStatus: data.verificationStatus,
    createdAt: toDate(data.createdAt) ?? new Date(),
    updatedAt: toDate(data.updatedAt) ?? new Date(),
    publishedAt: toDate(data.publishedAt)
  };
}

function clean(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}
