import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import type { App } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue, type DocumentData, type Query } from 'firebase-admin/firestore';
import { FIREBASE_APP } from '../../firebase/firebase.constants';
import type { UserProfile } from '../domain/user-profile';
import type { UserProfileRepository } from '../domain/user-profile.repository';

function fromFirestore(id: string, data: DocumentData): UserProfile {
  return {
    uid: id,
    email: data.email,
    displayName: data.displayName,
    phone: data.phone,
    avatarUrl: data.avatarUrl,
    role: data.role,
    status: data.status,
    locale: data.locale,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt)
  };
}

@Injectable()
export class FirestoreUserProfileRepository implements UserProfileRepository {
  private readonly collection;

  constructor(@Inject(FIREBASE_APP) app: App) {
    this.collection = getFirestore(app).collection('users');
  }

  async findByUid(uid: string): Promise<UserProfile | null> {
    const snapshot = await this.collection.doc(uid).get();
    return snapshot.exists ? fromFirestore(snapshot.id, snapshot.data() ?? {}) : null;
  }

  async list(limit: number, cursor?: string): Promise<{ items: UserProfile[]; nextCursor?: string }> {
    let query: Query = this.collection.orderBy('__name__').limit(limit);
    if (cursor) query = query.startAfter(cursor);
    const snapshot = await query.get();
    const items = snapshot.docs.map((doc) => fromFirestore(doc.id, doc.data()));
    return { items, nextCursor: items.length === limit ? items.at(-1)?.uid : undefined };
  }

  async save(profile: UserProfile): Promise<UserProfile> {
    await this.collection.doc(profile.uid).set(
      {
        ...clean(profile),
        createdAt: profile.createdAt,
        updatedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );
    return { ...profile, updatedAt: new Date() };
  }
}

function clean(profile: UserProfile): Record<string, unknown> {
  return Object.fromEntries(Object.entries(profile).filter(([, value]) => value !== undefined));
}
