import { Injectable } from '@nestjs/common';
import type { Lead, LeadType } from '../domain/lead';
import type { LeadRepository } from '../domain/lead.repository';

function page(items: Lead[], limit: number, cursor?: string): { items: Lead[]; nextCursor?: string } {
  const sorted = items.sort((left, right) => left.id.localeCompare(right.id));
  const start = cursor ? sorted.findIndex((item) => item.id === cursor) + 1 : 0;
  const paged = sorted.slice(Math.max(start, 0), Math.max(start, 0) + limit);
  const last = paged.at(-1);
  return { items: paged, nextCursor: paged.length === limit && last ? last.id : undefined };
}

@Injectable()
export class InMemoryLeadRepository implements LeadRepository {
  private readonly leads = new Map<string, Lead>();

  create(lead: Lead): Promise<Lead> {
    this.leads.set(lead.id, lead);
    return Promise.resolve(lead);
  }

  findById(id: string): Promise<Lead | null> {
    return Promise.resolve(this.leads.get(id) ?? null);
  }

  findRecentDuplicate(customerUid: string, type: LeadType, propertyId?: string, since?: Date): Promise<Lead | null> {
    return Promise.resolve(
      [...this.leads.values()].find(
        (lead) => lead.customerUid === customerUid && lead.type === type && lead.propertyId === propertyId && (!since || lead.createdAt >= since)
      ) ?? null
    );
  }

  listByCustomer(customerUid: string, limit: number, cursor?: string): Promise<{ items: Lead[]; nextCursor?: string }> {
    return Promise.resolve(page([...this.leads.values()].filter((lead) => lead.customerUid === customerUid), limit, cursor));
  }

  listByPartner(partnerId: string, limit: number, cursor?: string): Promise<{ items: Lead[]; nextCursor?: string }> {
    return Promise.resolve(page([...this.leads.values()].filter((lead) => lead.partnerId === partnerId), limit, cursor));
  }

  save(lead: Lead): Promise<Lead> {
    this.leads.set(lead.id, lead);
    return Promise.resolve(lead);
  }
}
