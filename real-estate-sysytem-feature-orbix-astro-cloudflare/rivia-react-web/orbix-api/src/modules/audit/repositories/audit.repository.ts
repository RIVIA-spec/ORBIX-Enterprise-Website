import type { AuditEvent } from '../domain/audit-event';

export interface AuditRepository {
  append(event: AuditEvent): Promise<void>;
  listForTesting?(): Promise<AuditEvent[]> | AuditEvent[];
}

export const AUDIT_REPOSITORY = Symbol('AUDIT_REPOSITORY');
