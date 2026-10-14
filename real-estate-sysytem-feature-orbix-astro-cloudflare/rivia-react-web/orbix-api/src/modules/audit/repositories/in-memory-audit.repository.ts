import { Injectable } from '@nestjs/common';
import type { AuditEvent } from '../domain/audit-event';
import type { AuditRepository } from './audit.repository';

@Injectable()
export class InMemoryAuditRepository implements AuditRepository {
  private readonly events: AuditEvent[] = [];

  append(event: AuditEvent): Promise<void> {
    this.events.push({ ...event, metadata: stripSensitive(event.metadata), previousState: stripSensitive(event.previousState), newState: stripSensitive(event.newState) });
    return Promise.resolve();
  }

  listForTesting(): AuditEvent[] {
    return [...this.events];
  }
}

function stripSensitive(value?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!value) return undefined;
  const output: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (/token|password|secret/i.test(key)) continue;
    output[key] = item;
  }
  return output;
}
