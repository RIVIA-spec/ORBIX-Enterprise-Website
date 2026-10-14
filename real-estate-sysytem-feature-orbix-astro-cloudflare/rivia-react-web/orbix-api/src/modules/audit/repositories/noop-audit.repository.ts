import { Injectable, Logger } from '@nestjs/common';
import type { AuditEvent } from '../domain/audit-event';
import type { AuditRepository } from './audit.repository';

@Injectable()
export class NoopAuditRepository implements AuditRepository {
  private readonly logger = new Logger(NoopAuditRepository.name);

  append(event: AuditEvent): Promise<void> {
    this.logger.debug(`Audit event accepted action=${event.action} entity=${event.entityType}:${event.entityId ?? '-'}`);
    return Promise.resolve();
  }
}
