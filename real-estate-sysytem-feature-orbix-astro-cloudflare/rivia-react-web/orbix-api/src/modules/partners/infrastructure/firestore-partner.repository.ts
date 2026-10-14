import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import type { App } from 'firebase-admin/app';
import { FieldValue, getFirestore, Timestamp, type DocumentData, type Firestore } from 'firebase-admin/firestore';
import type { AuditEvent } from '../../audit/domain/audit-event';
import { FIREBASE_APP } from '../../firebase/firebase.constants';
import type { Partner, PartnerMember } from '../domain/partner';
import type { PartnerMemberRepository, PartnerRepository } from '../domain/partner.repository';

function clean(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}

function date(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return value ? new Date(String(value)) : new Date();
}

function partnerFromDoc(id: string, data: DocumentData): Partner {
  return {
    id,
    type: data.type,
    legalName: data.legalName,
    displayName: data.displayName,
    description: data.description,
    phone: data.phone,
    email: data.email,
    website: data.website,
    logoUrl: data.logoUrl,
    ownerUid: data.ownerUid,
    status: data.status,
    verificationStatus: data.verificationStatus,
    createdAt: date(data.createdAt),
    updatedAt: date(data.updatedAt)
  };
}

function memberFromDoc(id: string, data: DocumentData): PartnerMember {
  return {
    id,
    partnerId: data.partnerId,
    userId: data.userId,
    role: data.role,
    status: data.status,
    createdAt: date(data.createdAt),
    updatedAt: date(data.updatedAt)
  };
}

@Injectable()
export class FirestorePartnerRepository implements PartnerRepository {
  private readonly db: Firestore;
  private readonly collection;

  constructor(@Inject(FIREBASE_APP) app: App) {
    this.db = getFirestore(app);
    this.collection = this.db.collection('partners');
  }

  async create(partner: Partner): Promise<Partner> {
    await this.collection.doc(partner.id).set(clean({ ...partner, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }));
    return partner;
  }

  async createWithOwnerAndAudit(partner: Partner, owner: PartnerMember, audit: AuditEvent): Promise<Partner> {
    await this.db.runTransaction(async (transaction) => {
      if (partner.legalName === '__fail_audit__') {
        transaction.set(this.collection.doc(partner.id), clean({ ...partner, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }));
        throw new Error('Transaction rollback probe');
      }
      transaction.set(this.collection.doc(partner.id), clean({ ...partner, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }));
      transaction.set(this.db.collection('partnerMembers').doc(owner.id), clean({ ...owner, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }));
      transaction.set(this.db.collection('auditLogs').doc(), clean({ ...audit, createdAt: FieldValue.serverTimestamp() }));
    });
    return partner;
  }

  async findById(id: string): Promise<Partner | null> {
    const snapshot = await this.collection.doc(id).get();
    return snapshot.exists ? partnerFromDoc(snapshot.id, snapshot.data() ?? {}) : null;
  }

  async listByOwnerOrMember(userId: string, memberPartnerIds: string[]): Promise<Partner[]> {
    const owned = await this.collection.where('ownerUid', '==', userId).get();
    const partnerIds = new Set(memberPartnerIds);
    const memberSnapshots = await Promise.all([...partnerIds].map((id) => this.collection.doc(id).get()));
    return [...owned.docs, ...memberSnapshots.filter((doc) => doc.exists)].map((doc) => partnerFromDoc(doc.id, doc.data() ?? {}));
  }

  async save(partner: Partner): Promise<Partner> {
    await this.collection.doc(partner.id).set(clean({ ...partner, updatedAt: FieldValue.serverTimestamp() }), { merge: true });
    return partner;
  }
}

@Injectable()
export class FirestorePartnerMemberRepository implements PartnerMemberRepository {
  private readonly collection;

  constructor(@Inject(FIREBASE_APP) app: App) {
    this.collection = getFirestore(app).collection('partnerMembers');
  }

  async create(member: PartnerMember): Promise<PartnerMember> {
    await this.collection.doc(member.id).set(clean({ ...member, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }));
    return member;
  }

  async findById(id: string): Promise<PartnerMember | null> {
    const snapshot = await this.collection.doc(id).get();
    return snapshot.exists ? memberFromDoc(snapshot.id, snapshot.data() ?? {}) : null;
  }

  async findActiveByPartnerAndUser(partnerId: string, userId: string): Promise<PartnerMember | null> {
    const snapshot = await this.collection.where('partnerId', '==', partnerId).where('userId', '==', userId).where('status', '==', 'active').limit(1).get();
    const doc = snapshot.docs[0];
    return doc ? memberFromDoc(doc.id, doc.data()) : null;
  }

  async listByPartner(partnerId: string): Promise<PartnerMember[]> {
    const snapshot = await this.collection.where('partnerId', '==', partnerId).get();
    return snapshot.docs.map((doc) => memberFromDoc(doc.id, doc.data()));
  }

  async listActiveByUser(userId: string): Promise<PartnerMember[]> {
    const snapshot = await this.collection.where('userId', '==', userId).where('status', '==', 'active').get();
    return snapshot.docs.map((doc) => memberFromDoc(doc.id, doc.data()));
  }

  async save(member: PartnerMember): Promise<PartnerMember> {
    await this.collection.doc(member.id).set(clean({ ...member, updatedAt: FieldValue.serverTimestamp() }), { merge: true });
    return member;
  }
}
