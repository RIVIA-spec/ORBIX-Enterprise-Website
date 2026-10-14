export interface AuditEvent {
  actorUid?: string;
  action: string;
  entityType: string;
  entityId?: string;
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  requestId?: string;
  createdAt: Date;
}
