import { Inject, Injectable } from '@nestjs/common';
import type { AuditEvent } from './domain/audit-event';
import { AUDIT_REPOSITORY, type AuditRepository } from './repositories/audit.repository';

type AuditInput = Omit<AuditEvent, 'createdAt' | 'entityType' | 'entityId'> & {
  entityType?: string;
  entityId?: string;
  resourceType?: string;
  resourceId?: string;
};

@Injectable()
export class AuditService {
  constructor(
    @Inject(AUDIT_REPOSITORY)
    private readonly repository: AuditRepository
  ) {}

  append(event: AuditInput): Promise<void> {
    const { resourceType, resourceId, ...rest } = event;
    return this.repository.append({
      ...rest,
      entityType: rest.entityType ?? resourceType ?? 'unknown',
      entityId: rest.entityId ?? resourceId,
      createdAt: new Date()
    });
  }

  async listForTesting(): Promise<AuditEvent[]> {
    if ('listForTesting' in this.repository && typeof this.repository.listForTesting === 'function') {
      return this.repository.listForTesting();
    }
    return [];
  }
}
