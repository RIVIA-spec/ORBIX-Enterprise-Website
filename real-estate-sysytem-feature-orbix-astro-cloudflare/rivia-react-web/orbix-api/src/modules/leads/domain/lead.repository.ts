import type { Lead, LeadType } from './lead';

export interface LeadRepository {
  create(lead: Lead): Promise<Lead>;
  findById(id: string): Promise<Lead | null>;
  findRecentDuplicate(customerUid: string, type: LeadType, propertyId?: string, since?: Date): Promise<Lead | null>;
  listByCustomer(customerUid: string, limit: number, cursor?: string): Promise<{ items: Lead[]; nextCursor?: string }>;
  listByPartner(partnerId: string, limit: number, cursor?: string): Promise<{ items: Lead[]; nextCursor?: string }>;
  save(lead: Lead): Promise<Lead>;
}

export const LEAD_REPOSITORY = Symbol('LEAD_REPOSITORY');
