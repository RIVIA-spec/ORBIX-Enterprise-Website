import { Injectable } from '@nestjs/common';
import type { Property } from '../domain/property';
import type { PropertyRepository } from '../domain/property.repository';

function page(items: Property[], limit: number, cursor?: string): { items: Property[]; nextCursor?: string } {
  const sorted = items.sort((left, right) => left.id.localeCompare(right.id));
  const start = cursor ? sorted.findIndex((item) => item.id === cursor) + 1 : 0;
  const paged = sorted.slice(Math.max(start, 0), Math.max(start, 0) + limit);
  const last = paged.at(-1);
  return { items: paged, nextCursor: paged.length === limit && last ? last.id : undefined };
}

@Injectable()
export class InMemoryPropertyRepository implements PropertyRepository {
  private readonly properties = new Map<string, Property>();

  create(property: Property): Promise<Property> {
    this.properties.set(property.id, property);
    return Promise.resolve(property);
  }

  findById(id: string): Promise<Property | null> {
    return Promise.resolve(this.properties.get(id) ?? null);
  }

  listPublished(limit: number, cursor?: string): Promise<{ items: Property[]; nextCursor?: string }> {
    return Promise.resolve(page([...this.properties.values()].filter((property) => property.status === 'published'), limit, cursor));
  }

  listByPartner(partnerId: string, limit: number, cursor?: string): Promise<{ items: Property[]; nextCursor?: string }> {
    return Promise.resolve(page([...this.properties.values()].filter((property) => property.partnerId === partnerId), limit, cursor));
  }

  listPending(limit: number, cursor?: string): Promise<{ items: Property[]; nextCursor?: string }> {
    return Promise.resolve(page([...this.properties.values()].filter((property) => property.status === 'pending_review'), limit, cursor));
  }

  save(property: Property): Promise<Property> {
    this.properties.set(property.id, property);
    return Promise.resolve(property);
  }
}
