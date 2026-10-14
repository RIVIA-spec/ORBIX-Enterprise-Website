import { Inject, Injectable } from '@nestjs/common';
import type { App } from 'firebase-admin/app';
import { FieldValue, getFirestore, Timestamp, type DocumentData } from 'firebase-admin/firestore';
import { FIREBASE_APP } from '../../firebase/firebase.constants';
import type { AuditEvent } from '../domain/audit-event';
import type { AuditRepository } from './audit.repository';

function clean(value: unknown): unknown {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) return value.map(clean).filter((item) => item !== undefined);
  if (value instanceof Date) return value;
  if (value && typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      if (/token|password|secret/i.test(key)) continue;
      const cleaned = clean(item);
      if (cleaned !== undefined) output[key] = cleaned;
    }
    return output;
  }
  return value;
}

function fromDoc(id: string, data: DocumentData): AuditEvent {
  return {
    actorUid: data.actorUid,
    action: data.action,
    entityType: data.entityType,
    entityId: data.entityId ?? id,
    previousState: data.previousState,
    newState: data.newState,
    metadata: data.metadata,
    requestId: data.requestId,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt)
  };
}

@Injectable()
export class FirestoreAuditRepository implements AuditRepository {
  private readonly collection;

  constructor(@Inject(FIREBASE_APP) app: App) {
    this.collection = getFirestore(app).collection('auditLogs');
  }

  async append(event: AuditEvent): Promise<void> {
    await this.collection.add({
      ...(clean(event) as Record<string, unknown>),
      createdAt: FieldValue.serverTimestamp()
    });
  }

  async listForTesting(): Promise<AuditEvent[]> {
    const snapshot = await this.collection.orderBy('createdAt').get();
    return snapshot.docs.map((doc) => fromDoc(doc.id, doc.data()));
  }
}
