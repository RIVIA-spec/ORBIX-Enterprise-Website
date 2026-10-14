import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { AuditService } from '../../audit/audit.service';
import { PartnersService } from '../../partners/application/partners.service';
import { PropertiesService } from '../../properties/application/properties.service';
import type { Lead, LeadStatus } from '../domain/lead';
import { LEAD_REPOSITORY, type LeadRepository } from '../domain/lead.repository';
import type { CreateLeadDto } from '../dto/lead.dto';

@Injectable()
export class LeadsService {
  constructor(
    @Inject(LEAD_REPOSITORY) private readonly leads: LeadRepository,
    private readonly properties: PropertiesService,
    private readonly partners: PartnersService,
    private readonly audit: AuditService
  ) {}

  async create(user: AuthenticatedUser, dto: CreateLeadDto): Promise<Lead> {
    let partnerId: string | undefined;
    if (dto.type !== 'partnership_request') {
      if (!dto.propertyId) throw new NotFoundException('Property not found');
      const property = await this.properties.getPublishedForLeads(dto.propertyId);
      partnerId = property.partnerId;
    }

    const since = new Date(Date.now() - 10 * 60 * 1000);
    const duplicate = await this.leads.findRecentDuplicate(user.uid, dto.type, dto.propertyId, since);
    if (duplicate) throw new ConflictException('Duplicate lead submitted recently');

    const now = new Date();
    return this.leads.create({
      id: randomUUID(),
      type: dto.type,
      propertyId: dto.propertyId,
      customerUid: user.uid,
      partnerId,
      name: dto.name,
      phone: dto.phone,
      email: dto.email,
      message: dto.message,
      source: dto.source,
      status: 'new',
      createdAt: now,
      updatedAt: now
    });
  }

  my(user: AuthenticatedUser, limit: number, cursor?: string) {
    return this.leads.listByCustomer(user.uid, limit, cursor);
  }

  async partnerLeads(user: AuthenticatedUser, partnerId: string, limit: number, cursor?: string) {
    await this.partners.requireMembership(partnerId, user);
    return this.leads.listByPartner(partnerId, limit, cursor);
  }

  async get(user: AuthenticatedUser, id: string): Promise<Lead> {
    const lead = await this.find(id);
    if (lead.customerUid === user.uid) return lead;
    if (lead.partnerId && (await this.partners.canAccessPartner(lead.partnerId, user.uid))) return lead;
    if (user.roles.includes('admin') || user.roles.includes('moderator')) return lead;
    throw new ForbiddenException('Lead access denied');
  }

  async updateStatus(user: AuthenticatedUser, id: string, status: LeadStatus): Promise<Lead> {
    const lead = await this.getPartnerOwnedLead(user, id);
    if (!canTransitionLead(lead.status, status)) throw new ConflictException('Invalid lead status transition');
    const now = new Date();
    const updated = await this.leads.save({
      ...lead,
      status,
      contactedAt: status === 'contacted' ? now : lead.contactedAt,
      closedAt: status === 'closed' || status === 'rejected' ? now : lead.closedAt,
      updatedAt: now
    });
    await this.audit.append({ actorUid: user.uid, action: 'lead.status_updated', resourceType: 'lead', resourceId: id, metadata: { status } });
    return updated;
  }

  async assign(user: AuthenticatedUser, id: string, assignedToUid: string): Promise<Lead> {
    const lead = await this.getPartnerOwnedLead(user, id, ['owner', 'manager']);
    const updated = await this.leads.save({ ...lead, assignedToUid, updatedAt: new Date() });
    await this.audit.append({ actorUid: user.uid, action: 'lead.assigned', resourceType: 'lead', resourceId: id, metadata: { assignedToUid } });
    return updated;
  }

  private async find(id: string): Promise<Lead> {
    const lead = await this.leads.findById(id);
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  private async getPartnerOwnedLead(user: AuthenticatedUser, id: string, roles?: Array<'owner' | 'manager'>): Promise<Lead> {
    const lead = await this.find(id);
    if (!lead.partnerId) throw new ForbiddenException('Lead is not assigned to a partner');
    await this.partners.requireMembership(lead.partnerId, user, roles);
    return lead;
  }
}

function canTransitionLead(from: LeadStatus, to: LeadStatus): boolean {
  return (
    (from === 'new' && (to === 'contacted' || to === 'rejected')) ||
    (from === 'contacted' && (to === 'qualified' || to === 'rejected')) ||
    (from === 'qualified' && (to === 'closed' || to === 'rejected'))
  );
}
