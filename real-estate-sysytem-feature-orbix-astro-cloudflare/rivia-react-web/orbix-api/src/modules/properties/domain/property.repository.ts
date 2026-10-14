import type { Property } from './property';

export interface PropertyRepository {
  create(property: Property): Promise<Property>;
  findById(id: string): Promise<Property | null>;
  listPublished(limit: number, cursor?: string): Promise<{ items: Property[]; nextCursor?: string }>;
  listByPartner(partnerId: string, limit: number, cursor?: string): Promise<{ items: Property[]; nextCursor?: string }>;
  listPending(limit: number, cursor?: string): Promise<{ items: Property[]; nextCursor?: string }>;
  save(property: Property): Promise<Property>;
}

export const PROPERTY_REPOSITORY = Symbol('PROPERTY_REPOSITORY');
